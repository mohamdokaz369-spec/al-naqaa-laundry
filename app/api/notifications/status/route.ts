import { NextResponse } from "next/server";
import { staffIdentity } from "@/lib/staff-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
export async function GET(req: Request) {
  if ((await staffIdentity(req))?.role !== "admin")
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { data, error } = await createServiceRoleClient()
    .from("notification_outbox")
    .select("channel,status,last_error,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json(
    {
      configured: {
        push: !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY)),
        whatsapp: !!(
          process.env.WHATSAPP_ACCESS_TOKEN &&
          process.env.WHATSAPP_PHONE_NUMBER_ID &&
          process.env.WHATSAPP_GRAPH_VERSION &&
          process.env.WHATSAPP_CUSTOMER_TEMPLATE
        ),
        worker: !!process.env.NOTIFICATION_WORKER_SECRET,
      },
      queue: data ?? [],
      queueAvailable: !error,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: Request) {
  if ((await staffIdentity(req))?.role !== "admin")
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { error } = await createServiceRoleClient()
    .from("notification_outbox")
    .update({ available_at: new Date().toISOString() })
    .in("status", ["blocked", "pending"]);
  return NextResponse.json(
    error ? { error: "تعذر تجهيز الإرسال" } : { ready: true },
    { status: error ? 503 : 200 },
  );
}
