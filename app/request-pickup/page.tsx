"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SERVICE_OPTIONS = [
  { value: "غسيل", label: "غسيل" },
  { value: "كي", label: "كي" },
  { value: "غسيل + كي", label: "غسيل + كي" },
  { value: "تنظيف جاف", label: "تنظيف جاف" },
  { value: "سجاد", label: "سجاد" },
  { value: "كنب", label: "كنب" },
  { value: "بطانيات", label: "بطانيات" },
];

type FormErrors = {
  customerName?: string;
  phone?: string;
  address?: string;
  serviceType?: string;
  pickupDate?: string;
  pickupTime?: string;
};

export default function RequestPickupPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [lastOrderNumber, setLastOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!customerName.trim()) newErrors.customerName = "الاسم مطلوب";
    if (!phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!address.trim()) newErrors.address = "العنوان مطلوب";
    if (!serviceType) newErrors.serviceType = "نوع الخدمة مطلوب";
    if (!pickupDate) newErrors.pickupDate = "تاريخ الاستلام مطلوب";
    if (!pickupTime) newErrors.pickupTime = "وقت الاستلام مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const submitOrder = async () => {
    if (!validate()) return;

    setLoading(true);
    setLastOrderNumber("");

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName,
          phone,
          address,
          service_type: serviceType,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          notes: notes.trim() || null,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error) {
      setLoading(false);
      alert("صار خطأ: " + error.message);
      return;
    }

    const orderNumber = `NQ-${data.id}`;

    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_number: orderNumber })
      .eq("id", data.id);

    setLoading(false);

    if (updateError) {
      alert("تم إنشاء الطلب لكن صار خطأ برقم الطلب: " + updateError.message);
      return;
    }

    setLastOrderNumber(orderNumber);
    setCustomerName("");
    setPhone("");
    setAddress("");
    setServiceType("");
    setPickupDate("");
    setPickupTime("");
    setNotes("");
    setErrors({});
  };

  if (lastOrderNumber) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
        <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white/10 p-8 text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="mb-2 text-2xl font-bold text-green-400">تم إرسال طلبك!</h2>
          <p className="mb-6 text-slate-300">احتفظ برقم الطلب لتتبع حالته</p>

          <div className="mb-6 rounded-xl border-2 border-cyan-500 bg-cyan-500/10 p-6">
            <p className="mb-1 text-sm text-slate-400">رقم طلبك</p>
            <p className="text-4xl font-bold tracking-widest text-cyan-300">{lastOrderNumber}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/track-order?order=${lastOrderNumber}`}
              className="rounded-full bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-500"
            >
              تتبع طلبي الآن
            </Link>
            <button
              onClick={() => setLastOrderNumber("")}
              className="rounded-full border border-white/20 px-6 py-3 font-bold hover:bg-white/10"
            >
              تقديم طلب جديد
            </button>
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto mt-10 max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          ← العودة للرئيسية
        </Link>

        <div className="rounded-2xl bg-white/10 p-6">
          <h1 className="mb-1 text-2xl font-bold">طلب استلام</h1>
          <p className="mb-6 text-sm text-slate-400">مغسلة النقاء · عرابة</p>

          <div className="flex flex-col gap-4">
            <div>
              <input
                className={`w-full rounded-lg border p-3 bg-transparent text-white placeholder-slate-500 ${
                  errors.customerName ? "border-red-500" : "border-white/20"
                }`}
                placeholder="الاسم الكامل *"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: undefined })); }}
              />
              {errors.customerName && <p className="mt-1 text-xs text-red-400">{errors.customerName}</p>}
            </div>

            <div>
              <input
                className={`w-full rounded-lg border p-3 bg-transparent text-white placeholder-slate-500 ${
                  errors.phone ? "border-red-500" : "border-white/20"
                }`}
                placeholder="رقم الهاتف *"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>

            <div>
              <input
                className={`w-full rounded-lg border p-3 bg-transparent text-white placeholder-slate-500 ${
                  errors.address ? "border-red-500" : "border-white/20"
                }`}
                placeholder="العنوان *"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: undefined })); }}
              />
              {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address}</p>}
            </div>

            <div>
              <select
                className={`w-full rounded-lg border p-3 bg-slate-900 text-white ${
                  errors.serviceType ? "border-red-500" : "border-white/20"
                }`}
                value={serviceType}
                onChange={(e) => { setServiceType(e.target.value); setErrors((p) => ({ ...p, serviceType: undefined })); }}
              >
                <option value="">نوع الخدمة *</option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.serviceType && <p className="mt-1 text-xs text-red-400">{errors.serviceType}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">تاريخ الاستلام *</label>
                <input
                  type="date"
                  className={`w-full rounded-lg border p-3 bg-transparent text-white ${
                    errors.pickupDate ? "border-red-500" : "border-white/20"
                  }`}
                  value={pickupDate}
                  onChange={(e) => { setPickupDate(e.target.value); setErrors((p) => ({ ...p, pickupDate: undefined })); }}
                />
                {errors.pickupDate && <p className="mt-1 text-xs text-red-400">{errors.pickupDate}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">وقت الاستلام *</label>
                <input
                  type="time"
                  className={`w-full rounded-lg border p-3 bg-transparent text-white ${
                    errors.pickupTime ? "border-red-500" : "border-white/20"
                  }`}
                  value={pickupTime}
                  onChange={(e) => { setPickupTime(e.target.value); setErrors((p) => ({ ...p, pickupTime: undefined })); }}
                />
                {errors.pickupTime && <p className="mt-1 text-xs text-red-400">{errors.pickupTime}</p>}
              </div>
            </div>

            <div>
              <textarea
                className="w-full rounded-lg border border-white/20 bg-transparent p-3 text-white placeholder-slate-500 resize-none"
                placeholder="ملاحظات إضافية (اختياري)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={submitOrder}
              disabled={loading}
              className="rounded-lg bg-cyan-600 p-3 font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
