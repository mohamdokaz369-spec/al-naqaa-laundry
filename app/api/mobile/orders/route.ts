import { after, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { staffIdentity } from "@/lib/staff-auth";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
const statuses = [
  "pending",
  "scheduled",
  "assigned",
  "on_the_way",
  "arrived",
  "picked_up",
  "washing",
  "ready",
  "delivering",
  "completed",
  "cancelled",
] as const;
export const maxDuration=60;
export async function GET(req: Request) {
  const identity = await staffIdentity(req);
  if (!identity)
    return NextResponse.json({ error: "سجّل الدخول" }, { status: 401 });
  let query = createServiceRoleClient()
    .from("orders")
    .select(
      "id,order_number,customer_name,phone,address,service_type,status,pickup_date,pickup_time,total_amount,payment_status,google_maps_link",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (identity.role === "driver")
    query = query.eq("assigned_driver_id", identity.driverId);
  const { data, error } = await query;
  return NextResponse.json(
    error
      ? { error: "تعذر تحميل الطلبات" }
      : { orders: data, role: identity.role },
    { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
export async function PATCH(req: Request) {
  const identity = await staffIdentity(req);
  if (!identity)
    return NextResponse.json({ error: "سجّل الدخول" }, { status: 401 });
  const parsed = z
    .object({
      id: z.number().int().positive(),
      status: z.enum(statuses),
      expected_status: z.enum(statuses),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const authorization = req.headers.get("authorization");
  const db = authorization
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: authorization } },
          auth: { persistSession: false, autoRefreshToken: false },
        },
      )
    : await createServerSupabaseClient();
  const { data, error } = await db
    .from("orders")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("status", parsed.data.expected_status)
    .select("id");
  if (error || !data?.length)
    return NextResponse.json(
      {
        error: "تعذر التحديث أو تغيّرت حالة الطلب. حدّث القائمة وحاول مجددًا.",
      },
      { status: 409 },
    );
  after(async () => {
    try {
      await dispatchNotifications();
    } catch {
      /* Worker retries the outbox. */
    }
  });
  return NextResponse.json({ updated: true });
}
