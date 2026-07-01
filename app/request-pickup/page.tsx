"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { businessStatusMessage } from "@/lib/business-hours";
import { businessWhatsAppUrl } from "@/lib/whatsapp";
import { ToastBanner } from "@/components/Toast";
import type { ToastState } from "@/components/Toast";

type LastOrderDetails = {
  customerName: string;
  phone: string;
  address: string;
  serviceType: string;
  pickupDate: string;
  pickupTime: string;
  googleMapsLink: string;
};

const SERVICE_OPTIONS = [
  { value: "غسيل", label: "غسيل" },
  { value: "كي", label: "كي" },
  { value: "غسيل + كي", label: "غسيل + كي" },
  { value: "تنظيف جاف", label: "تنظيف جاف" },
  { value: "سجاد", label: "سجاد" },
  { value: "سجاد آلي", label: "غسيل السجاد بماكينة Full Automatic" },
  { value: "كنب", label: "كنب" },
  { value: "بطانيات", label: "بطانيات" },
];

type FormErrors = {
  customerName?: string;
  phone?: string;
  location?: string;
  serviceType?: string;
  pickupDate?: string;
  pickupTime?: string;
};

function validatePhone(p: string): boolean {
  const cleaned = p.replace(/\s/g, "");
  // Israeli mobile: 05X, +9725X, 9725X — 10-13 digits
  return /^(\+972|972|0)[5]\d{7,8}$/.test(cleaned) || /^\d{9,12}$/.test(cleaned);
}

export default function RequestPickupPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");

  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "success" | "error">("idle");
  const [locationLoading, setLocationLoading] = useState(false);

  const [lastOrderNumber, setLastOrderNumber] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastOrderDetails, setLastOrderDetails] = useState<LastOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  function hasLocation(): boolean {
    return (
      address.trim().length > 0 ||
      (locationLat !== null && locationLng !== null) ||
      googleMapsLink.trim().length > 0
    );
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!customerName.trim()) newErrors.customerName = "الاسم مطلوب";
    if (!phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "رقم الهاتف غير صحيح";
    }
    if (!hasLocation()) newErrors.location = "يجب إدخال العنوان أو تحديد الموقع";
    if (!serviceType) newErrors.serviceType = "نوع الخدمة مطلوب";
    if (!pickupDate) newErrors.pickupDate = "تاريخ الاستلام مطلوب";
    if (!pickupTime) newErrors.pickupTime = "وقت الاستلام مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationLoading(true);
    setLocationStatus("idle");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationLat(lat);
        setLocationLng(lng);
        const link = `https://www.google.com/maps?q=${lat},${lng}`;
        setGoogleMapsLink(link);
        setLocationStatus("success");
        setLocationLoading(false);
        setErrors((p) => ({ ...p, location: undefined }));
      },
      () => {
        setLocationStatus("error");
        setLocationLoading(false);
      },
      { timeout: 10000 }
    );
  }

  const submitOrder = async () => {
    if (!validate()) return;

    setLoading(true);
    setLastOrderNumber("");

    const effectiveMapsLink =
      googleMapsLink.trim() ||
      (locationLat !== null && locationLng !== null
        ? `https://www.google.com/maps?q=${locationLat},${locationLng}`
        : null);

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          service_type: serviceType,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          notes: notes.trim() || null,
          location_lat: locationLat,
          location_lng: locationLng,
          google_maps_link: effectiveMapsLink,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error) {
      setLoading(false);
      setToast({ type: "error", message: "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى" });
      return;
    }

    const orderNumber = `NQ-${data.id}`;

    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_number: orderNumber })
      .eq("id", data.id);

    setLoading(false);

    if (updateError) {
      setToast({ type: "warning", message: "تم إنشاء الطلب لكن حدث خطأ في تعيين رقم الطلب" });
      return;
    }

    setLastOrderDetails({
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      serviceType,
      pickupDate,
      pickupTime,
      googleMapsLink: effectiveMapsLink || "",
    });
    setLastOrderNumber(orderNumber);
    setSuccessMessage(businessStatusMessage());

    // Reset form
    setCustomerName("");
    setPhone("");
    setAddress("");
    setServiceType("");
    setPickupDate("");
    setPickupTime("");
    setNotes("");
    setLocationLat(null);
    setLocationLng(null);
    setGoogleMapsLink("");
    setLocationStatus("idle");
    setErrors({});
  };

  if (lastOrderNumber) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
        <ToastBanner toast={toast} onDismiss={dismissToast} />
        <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white/10 p-8 text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="mb-2 text-2xl font-bold text-green-400">تم إرسال طلبك!</h2>
          <p className="mb-4 text-sm text-slate-300">{successMessage}</p>

          <div className="mb-6 rounded-xl border-2 border-cyan-500 bg-cyan-500/10 p-6">
            <p className="mb-1 text-sm text-slate-400">رقم طلبك</p>
            <p className="text-4xl font-bold tracking-widest text-cyan-300">{lastOrderNumber}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/track/${lastOrderNumber}`}
              className="rounded-full bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-500"
            >
              تتبع طلبي الآن
            </Link>
            {lastOrderDetails && (
              <a
                href={businessWhatsAppUrl(
                  `مرحبا مغسلة النقاء، تم إنشاء طلب جديد:\nرقم الطلب: ${lastOrderNumber}\nالاسم: ${lastOrderDetails.customerName}\nالهاتف: ${lastOrderDetails.phone}\nالعنوان: ${lastOrderDetails.address || "—"}\nالخدمة: ${lastOrderDetails.serviceType}\nالموعد: ${lastOrderDetails.pickupDate} الساعة ${lastOrderDetails.pickupTime}${lastOrderDetails.googleMapsLink ? `\nرابط الموقع: ${lastOrderDetails.googleMapsLink}` : ""}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-bold text-white hover:bg-[#20bd5a]"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.854L.057 23.882l6.187-1.621A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892a9.877 9.877 0 01-5.031-1.376l-.361-.214-3.735.979 1.005-3.645-.235-.374A9.861 9.861 0 012.108 12C2.108 6.527 6.527 2.108 12 2.108c5.473 0 9.892 4.419 9.892 9.892 0 5.473-4.419 9.892-9.892 9.892z" />
                </svg>
                إرسال الطلب عبر واتساب
              </a>
            )}
            <button
              onClick={() => setLastOrderNumber("")}
              className="rounded-full border border-white/20 px-6 py-3 font-bold hover:bg-white/10"
            >
              تقديم طلب جديد
            </button>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-300">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <ToastBanner toast={toast} onDismiss={dismissToast} />
      <div className="mx-auto mt-10 max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← العودة للرئيسية
        </Link>

        <div className="rounded-2xl bg-white/10 p-6">
          <h1 className="mb-1 text-2xl font-bold">طلب استلام</h1>
          <p className="mb-6 text-sm text-slate-400">مغسلة النقاء · عرابة</p>

          <div className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <input
                className={`w-full rounded-lg border p-3 bg-transparent text-white placeholder-slate-500 ${
                  errors.customerName ? "border-red-500" : "border-white/20"
                }`}
                placeholder="الاسم الكامل *"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setErrors((p) => ({ ...p, customerName: undefined }));
                }}
              />
              {errors.customerName && (
                <p className="mt-1 text-xs text-red-400">{errors.customerName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <input
                className={`w-full rounded-lg border p-3 bg-transparent text-white placeholder-slate-500 ${
                  errors.phone ? "border-red-500" : "border-white/20"
                }`}
                placeholder="رقم الهاتف * — مثال: 0501234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((p) => ({ ...p, phone: undefined }));
                }}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Address + Location */}
            <div className={`rounded-xl border p-4 ${errors.location ? "border-red-500" : "border-white/10"}`}>
              <p className="mb-3 text-sm font-medium text-slate-300">
                الموقع *{" "}
                <span className="text-slate-500 text-xs">(العنوان أو الموقع الجغرافي)</span>
              </p>

              <input
                className="w-full rounded-lg border border-white/20 bg-transparent p-3 text-white placeholder-slate-500 mb-3"
                placeholder="العنوان النصي (مثل: شارع الزهور، عرابة)"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrors((p) => ({ ...p, location: undefined }));
                }}
              />

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="mb-3 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
              >
                {locationLoading ? "جاري تحديد موقعك..." : "📍 استخدم موقعي الحالي"}
              </button>

              {locationStatus === "success" && (
                <p className="mb-3 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400 border border-green-500/30">
                  ✓ تم تحديد موقعك بنجاح
                </p>
              )}
              {locationStatus === "error" && (
                <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/30">
                  تعذر تحديد الموقع. أدخل العنوان يدوياً أو الصق رابط الخريطة.
                </p>
              )}

              <input
                className="w-full rounded-lg border border-white/20 bg-transparent p-3 text-sm text-white placeholder-slate-500"
                placeholder="أو الصق رابط Google Maps هنا"
                value={googleMapsLink}
                onChange={(e) => {
                  setGoogleMapsLink(e.target.value);
                  setLocationLat(null);
                  setLocationLng(null);
                  setErrors((p) => ({ ...p, location: undefined }));
                }}
              />
            </div>
            {errors.location && (
              <p className="-mt-2 text-xs text-red-400">{errors.location}</p>
            )}

            {/* Service type */}
            <div>
              <select
                className={`w-full rounded-lg border p-3 bg-slate-900 text-white ${
                  errors.serviceType ? "border-red-500" : "border-white/20"
                }`}
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  setErrors((p) => ({ ...p, serviceType: undefined }));
                }}
              >
                <option value="">نوع الخدمة *</option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.serviceType && (
                <p className="mt-1 text-xs text-red-400">{errors.serviceType}</p>
              )}
            </div>

            {/* Pickup date / time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">تاريخ الاستلام *</label>
                <input
                  type="date"
                  className={`w-full rounded-lg border p-3 bg-transparent text-white ${
                    errors.pickupDate ? "border-red-500" : "border-white/20"
                  }`}
                  value={pickupDate}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    setErrors((p) => ({ ...p, pickupDate: undefined }));
                  }}
                />
                {errors.pickupDate && (
                  <p className="mt-1 text-xs text-red-400">{errors.pickupDate}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">وقت الاستلام *</label>
                <input
                  type="time"
                  className={`w-full rounded-lg border p-3 bg-transparent text-white ${
                    errors.pickupTime ? "border-red-500" : "border-white/20"
                  }`}
                  value={pickupTime}
                  onChange={(e) => {
                    setPickupTime(e.target.value);
                    setErrors((p) => ({ ...p, pickupTime: undefined }));
                  }}
                />
                {errors.pickupTime && (
                  <p className="mt-1 text-xs text-red-400">{errors.pickupTime}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <textarea
                className="w-full resize-none rounded-lg border border-white/20 bg-transparent p-3 text-white placeholder-slate-500"
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
