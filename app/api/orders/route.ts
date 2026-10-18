import { after } from "next/server";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { orderCreateSchema } from "@/lib/validation";
import { isRateLimited, clientIp } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Creates a new customer order from the public /request-pickup form.
 *
 * Runs on the server with the service-role key, after validating the
 * request body with zod — this replaces the previous flow where the
 * browser inserted directly into `orders` with the anon key and no
 * server-side validation at all.
 */
export const maxDuration=60;
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (await isRateLimited(`orders:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "محاولات كثيرة جدًا، حاول مرة أخرى بعد دقيقة" },
        { status: 429 }
      );
    }

    const requestKey = req.headers.get("Idempotency-Key");
    if (!requestKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) return NextResponse.json({ error: "مفتاح الطلب غير صالح" }, { status: 400 });
    const body = await req.json().catch(() => null);
    const parsed = orderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات الطلب غير صحيحة" }, { status: 400 });
    }
    const input = parsed.data;
    const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");

    const supabase = createServiceRoleClient();

    const { data: previous } = await supabase.from("orders").select("order_number,request_hash").eq("request_key", requestKey).maybeSingle();
    if (previous) return previous.request_hash === requestHash ? NextResponse.json({ orderNumber: previous.order_number }) : NextResponse.json({ error: "بيانات الطلب تغيّرت، أرسل طلبًا جديدًا" }, { status: 409 });
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          request_key: requestKey,
          request_hash: requestHash,
          customer_name: input.customer_name,
          phone: input.phone,
          address: input.address || null,
          service_type: input.service_type,
          pickup_date: input.pickup_date,
          pickup_time: input.pickup_time,
          notes: input.notes || null,
          whatsapp_opt_in: input.whatsapp_opt_in,
          whatsapp_opt_in_at: input.whatsapp_opt_in ? new Date().toISOString() : null,
          location_lat: input.location_lat ?? null,
          location_lng: input.location_lng ?? null,
          google_maps_link: input.google_maps_link || null,
          status: "pending",
          order_source: "website",
          fulfillment_type: "home_pickup",
        },
      ])
      .select("id,order_number")
      .single();

    if (error?.code === "23505") {
      const { data: duplicate } = await supabase.from("orders").select("order_number,request_hash").eq("request_key", requestKey).maybeSingle();
      if (duplicate) return duplicate.request_hash === requestHash ? NextResponse.json({ orderNumber: duplicate.order_number }) : NextResponse.json({ error: "مفتاح الطلب مستخدم لبيانات مختلفة" }, { status: 409 });
    }
    if (error || !data) {
      return NextResponse.json({ error: "حدث خطأ أثناء إرسال الطلب" }, { status: 500 });
    }

    after(async () => { try { await dispatchNotifications(); } catch { /* Durable outbox remains pending for the worker. */ } });
    return NextResponse.json({ orderNumber: data.order_number }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "الخدمة غير متاحة مؤقتًا، حاول لاحقًا" }, { status: 503 });
  }
}
