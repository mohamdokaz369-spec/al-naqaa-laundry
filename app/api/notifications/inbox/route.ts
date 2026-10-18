import { NextResponse } from "next/server";
import { staffIdentity } from "@/lib/staff-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
export async function GET(req: Request) {
  const identity = await staffIdentity(req);
  if (identity?.role !== "admin")
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { data, error } = await createServiceRoleClient()
    .from("admin_notifications")
    .select("id,order_id,title,created_at,read_at")
    .eq("user_id", identity.id)
    .order("created_at", { ascending: false })
    .limit(30);
  return NextResponse.json(
    error ? { error: "تعذر تحميل الإشعارات" } : { notifications: data },
    { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
export async function PATCH(req: Request) {
  const identity = await staffIdentity(req);
  if (identity?.role !== "admin")
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { error } = await createServiceRoleClient()
    .from("admin_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", identity.id)
    .is("read_at", null);
  return NextResponse.json(
    error ? { error: "تعذر تحديث الإشعارات" } : { read: true },
    { status: error ? 503 : 200 },
  );
}
