import { after, NextResponse } from "next/server";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { z } from "zod";
import { staffIdentity } from "@/lib/staff-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
const schema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(["ios", "android"]),
});
export const maxDuration=60;
export async function POST(req: Request) {
  const identity = await staffIdentity(req);
  if (identity?.role !== "admin")
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const input = schema.safeParse(await req.json().catch(() => null));
  if (!input.success)
    return NextResponse.json(
      { error: "بيانات الجهاز غير صحيحة" },
      { status: 400 },
    );
  const { error } = await createServiceRoleClient()
    .from("push_devices")
    .upsert(
      {
        user_id: identity.id,
        ...input.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
  if (!error) {
    await createServiceRoleClient().from("notification_outbox").update({available_at:new Date().toISOString()}).eq("channel","push_admin").eq("status","blocked");
    after(async()=>{try{await dispatchNotifications();}catch{/* Worker retries. */}});
  }
  return NextResponse.json(
    error ? { error: "تعذر تسجيل الجهاز" } : { registered: true },
    { status: error ? 503 : 200 },
  );
}
export async function DELETE(req: Request) {
  const identity = await staffIdentity(req);
  if (!identity)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.token !== "string")
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const { error } = await createServiceRoleClient()
    .from("push_devices")
    .delete()
    .eq("token", body.token)
    .eq("user_id", identity.id);
  return NextResponse.json(
    error ? { error: "تعذر إلغاء الجهاز" } : { removed: true },
    { status: error ? 503 : 200 },
  );
}
