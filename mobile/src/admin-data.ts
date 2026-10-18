import { normalizePhone } from '../../lib/phone';
import { ORDER_STATUSES, SERVICE_LABELS } from '../../lib/types';
export type AdminForm = {
  customer_name: string; phone: string; address: string; service_type: string;
  status: string; pickup_date: string; pickup_time: string; notes: string;
  assigned_driver_id: string; route_order: string; items_count: string;
  total_amount: string; payment_status: string; google_maps_link: string;
  scheduled_at: string; expected_delivery_time: string;
};
export function adminOrderPayload(form: AdminForm, activeDriverIds: number[], previousDriverId: number | null = null) {
  const phone = normalizePhone(form.phone);
  if (form.customer_name.trim().length < 2 || form.customer_name.trim().length > 100 || !phone) throw new Error('الاسم ورقم هاتف صحيح مطلوبان');
  if (!ORDER_STATUSES.includes(form.status as never) && form.status !== 'delivered') throw new Error('الحالة غير صحيحة');
  if (!(form.service_type in SERVICE_LABELS)) throw new Error('الخدمة غير صحيحة');
  if (form.address.length > 300 || form.notes.length > 500) throw new Error('العنوان أو الملاحظات أطول من المسموح');
  function number(value: string, integer = false) {
    if (!value.trim()) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < (integer ? 1 : 0) || n > 9999999999.99 || (integer && !Number.isSafeInteger(n)) || (!integer && Math.abs(n * 100 - Math.round(n * 100)) > 0.00001)) throw new Error(integer ? 'العدد يجب أن يكون صحيحًا وموجبًا' : 'المبلغ يجب أن يكون موجبًا أو صفرًا وبدقتين عشريتين كحد أقصى');
    return n;
  }
  const assigned_driver_id = number(form.assigned_driver_id, true);
  if (assigned_driver_id !== null && assigned_driver_id !== previousDriverId && !activeDriverIds.includes(assigned_driver_id)) throw new Error('اختر سائقًا مفعّلًا');
  const total_amount = number(form.total_amount);
  if (!['paid','unpaid'].includes(form.payment_status) || (form.payment_status === 'paid' && total_amount === null)) throw new Error('حدد المبلغ قبل تسجيل التحصيل');
  const link = form.google_maps_link.trim();
  if (link) {
    let url: URL;
    try { url = new URL(link); } catch { throw new Error('رابط خرائط غير صالح'); }
    if (url.protocol !== 'https:' || !['google.com','www.google.com','maps.google.com','maps.app.goo.gl','goo.gl'].includes(url.hostname)) throw new Error('استخدم رابط خرائط Google آمن');
  }
  if (form.pickup_date && (!/^\d{4}-\d{2}-\d{2}$/.test(form.pickup_date) || !Number.isFinite(Date.parse(form.pickup_date)) || new Date(form.pickup_date).toISOString().slice(0,10) !== form.pickup_date)) throw new Error('تاريخ غير صحيح');
  if (form.pickup_time && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(form.pickup_time)) throw new Error('وقت غير صحيح');
  function instant(value: string) { if (!value) return null; const d = new Date(value); if (!Number.isFinite(d.getTime())) throw new Error('موعد غير صحيح'); return d.toISOString(); }
  return { customer_name: form.customer_name.trim(), phone, address: form.address.trim() || null,
    service_type: form.service_type, status: form.status, pickup_date: form.pickup_date || null,
    pickup_time: form.pickup_time || null, notes: form.notes.trim() || null, assigned_driver_id,
    route_order: number(form.route_order,true), items_count: number(form.items_count,true),
    total_amount, payment_status: form.payment_status, google_maps_link: link || null,
    scheduled_at: instant(form.scheduled_at), expected_delivery_time: instant(form.expected_delivery_time) };
}
