import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { staffIdentity } from "@/lib/staff-auth";
export const maxDuration = 60;
export async function POST(req: Request) {
  const secret = process.env.NOTIFICATION_WORKER_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";
  const worker =
    !!expected &&
    Buffer.byteLength(auth) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!worker && (await staffIdentity(req))?.role !== "admin")
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    return NextResponse.json(await dispatchNotifications());
  } catch {
    return NextResponse.json({ error: "تعذر تشغيل الإرسال" }, { status: 503 });
  }
}
