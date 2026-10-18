import { etaMinutes, haversineKm } from "@/lib/route-optimizer";
import { NextResponse } from "next/server";
import { trackRequestSchema } from "@/lib/validation";
import { normalizeOrderNumber } from "@/lib/order-number";
import { isRateLimited, clientIp } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Looks up a single order for the public tracking pages. Requires BOTH the
 * order number AND the phone number on the order to match — the same
 * two-factor check the UI already did, but now enforced here on the
 * server with the service-role key instead of as a plain `.eq()` filter
 * that a direct REST call with the anon key could simply omit.
 *
 * Returns a generic "not found" either way (wrong number, wrong phone, or
 * no such order) so this endpoint can't be used to enumerate which order
 * numbers exist.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (await isRateLimited(`track:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "محاولات كثيرة جدًا، حاول مرة أخرى بعد دقيقة" },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = trackRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    const orderNumber = normalizeOrderNumber(parsed.data.order_number);
    const phone = parsed.data.phone.trim();

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, phone, address, service_type, status, pickup_date, pickup_time, expected_delivery_time, estimated_arrival, fulfillment_type, items_count, created_at, assigned_driver_id, location_lat, location_lng"
      )
      .eq("order_number", orderNumber)
      .in("phone", [phone, `0${phone.slice(3)}`, `+${phone}`])
      .maybeSingle();

    if (error) return NextResponse.json({ error: "تعذر تحميل الطلب" }, { status: 503 });
    if (!data) {
      return NextResponse.json(
        { error: "لم يتم العثور على طلب بهذا الرقم وهذا الهاتف" },
        { status: 404 }
      );
    }

    let arrival: string | null = null;
    if (["on_the_way", "delivering"].includes(data.status) && data.assigned_driver_id && data.location_lat != null && data.location_lng != null) {
      const { data: driver } = await supabase.from("drivers").select("current_lat,current_lng,last_location_update,is_active").eq("id",data.assigned_driver_id).single();
      if (driver?.is_active && driver.current_lat != null && driver.current_lng != null && driver.last_location_update && Date.now() - new Date(driver.last_location_update).getTime() < 120000) {
        arrival = new Date(Date.now() + Math.max(1, etaMinutes(haversineKm(driver.current_lat,driver.current_lng,data.location_lat,data.location_lng))) * 60000).toISOString();
      }
    }
    const order = { id: data.id, order_number: data.order_number, customer_name: data.customer_name, service_type: data.service_type, status: data.status, pickup_date: data.pickup_date, pickup_time: data.pickup_time, expected_delivery_time: data.expected_delivery_time, estimated_arrival: arrival, fulfillment_type: data.fulfillment_type, items_count: data.items_count, created_at: data.created_at };
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "الخدمة غير متاحة مؤقتًا، حاول لاحقًا" }, { status: 503 });
  }
}
