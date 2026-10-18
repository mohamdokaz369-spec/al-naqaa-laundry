import { verifyMetaSignature, isWhatsAppOptOut } from "@/lib/notifications/webhook-security";
import { normalizePhone } from "@/lib/phone";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
export async function GET(req: Request) {
  const url = new URL(req.url),
    token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (
    token &&
    url.searchParams.get("hub.mode") === "subscribe" &&
    url.searchParams.get("hub.verify_token") === token
  )
    return new Response(url.searchParams.get("hub.challenge") ?? "");
  return new Response("Forbidden", { status: 403 });
}
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return new Response("Unavailable", { status: 503 });
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 256000)
    return new Response("Too large", { status: 413 });
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  if (!verifyMetaSignature(raw,signature,secret)) return new Response("Forbidden",{status:403});
  try {
    const body = JSON.parse(raw);
    if (body.object !== "whatsapp_business_account")
      return NextResponse.json({ received: true });
    const db = createServiceRoleClient();
    for (const entry of body.entry ?? []) for (const change of entry.changes ?? []) for (const message of change.value?.messages ?? []) {
      const phone=normalizePhone(message.from??"");
      if(phone&&isWhatsAppOptOut(message.text?.body)) {
        const {error}=await db.from("orders").update({whatsapp_opt_in:false,whatsapp_opt_out_at:new Date().toISOString()}).in("phone",[phone,`0${phone.slice(3)}`,`+${phone}`]);
        if(error)throw new Error("Unable to store opt out");
      }
    }
    for (const entry of body.entry ?? [])
      for (const change of entry.changes ?? [])
        for (const status of change.value?.statuses ?? []) {
          if (
            typeof status.id === "string" &&
            ["sent", "delivered", "read", "failed"].includes(status.status)
          ) {
            const { error } = await db.rpc("record_notification_delivery",{message_id:status.id,next_state:status.status});
            if (error) throw new Error("Unable to store delivery status");
          }
        }
    return NextResponse.json({ received: true });
  } catch {
    return new Response("Unable to process", { status: 503 });
  }
}
