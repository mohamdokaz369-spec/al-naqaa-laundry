import { z } from "zod";
import { businessClock, isWorkingDate } from "./business-hours";
import { normalizePhone } from "./phone";
export function isValidPhone(phone: string): boolean { return !!normalizePhone(phone); }
const phone = z.string().max(30).transform(normalizePhone).refine(Boolean, "رقم الهاتف غير صالح");
export const orderCreateSchema = z.object({
  customer_name: z.string().trim().min(2).max(100), phone,
  address: z.string().trim().max(300).optional().nullable(),
  service_type: z.enum(["غسيل", "كي", "غسيل + كي", "تنظيف جاف", "سجاد", "سجاد آلي", "كنب", "بطانيات"]),
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d => { const n = new Date(`${d}T12:00:00Z`); return !isNaN(n.getTime()) && n.toISOString().slice(0,10) === d && isWorkingDate(d); }, "اختر يوم عمل صحيح"),
  pickup_time: z.string().regex(/^(09|1[0-7]):[0-5]\d$/, "موعد الاستلام يجب أن يكون ضمن الدوام من 09:00 حتى قبل 18:00"),
  whatsapp_opt_in: z.boolean().optional().default(false),
  notes: z.string().trim().max(500).optional().nullable(),
  location_lat: z.number().min(-90).max(90).nullable().optional(),
  location_lng: z.number().min(-180).max(180).nullable().optional(),
  google_maps_link: z.string().trim().max(500).refine(s => { try { const u = new URL(s); return u.protocol === "https:" && ["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"].includes(u.hostname); } catch { return !s; } }, "رابط خرائط غير صالح").nullable().optional(),
}).superRefine((input, ctx) => {
  if (!input.address && !(input.location_lat != null && input.location_lng != null) && !input.google_maps_link) ctx.addIssue({ code: "custom", path: ["address"], message: "العنوان أو الموقع مطلوب" });
  if ((input.location_lat == null) !== (input.location_lng == null)) ctx.addIssue({ code: "custom", path: ["location_lat"], message: "إحداثيات غير مكتملة" });
  const now = businessClock();
  if (`${input.pickup_date} ${input.pickup_time}` <= `${now.date} ${now.time}`) ctx.addIssue({ code: "custom", path: ["pickup_date"], message: "اختر موعدًا مستقبليًا" });
});
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export const trackRequestSchema = z.object({ order_number: z.string().trim().min(1).max(30), phone });
export type TrackRequestInput = z.infer<typeof trackRequestSchema>;
