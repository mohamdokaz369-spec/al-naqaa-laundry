"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  service_type: string;
  status: string;
  pickup_date: string | null;
  pickup_time: string | null;
  expected_delivery_time: string | null;
  created_at: string;
};

const statusArabic: Record<string, string> = {
  pending: "بانتظار الاستلام",
  picked_up: "تم الاستلام",
  washing: "قيد الغسيل",
  ready: "جاهز للتسليم",
  delivered: "تم التسليم",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  picked_up: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  washing: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  ready: "bg-green-500/20 text-green-300 border-green-500/40",
  delivered: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

/**
 * Normalize order number input to canonical NQ-N format.
 * Accepts: NQ-5, nq-5, nq5, 5, #5
 */
function normalizeOrderNumber(input: string): string {
  const s = input.trim();
  // Already NQ-N
  if (/^NQ-\d+$/i.test(s)) return s.toUpperCase();
  // NQN (no dash)
  const nqNoDash = s.match(/^nq(\d+)$/i);
  if (nqNoDash) return `NQ-${nqNoDash[1]}`;
  // #5 or plain digit(s)
  const num = s.replace(/^#/, "").match(/^\d+$/);
  if (num) return `NQ-${num[0]}`;
  // Fallback: uppercase as-is
  return s.toUpperCase();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dtStr: string | null) {
  if (!dtStr) return null;
  try {
    return new Date(dtStr).toLocaleString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dtStr;
  }
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Pre-fill order number from query param but do NOT auto-search
  // (phone is required, so we can't auto-submit without it)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("order");
    if (fromQuery) setOrderNumber(fromQuery);
  }, []);

  async function handleSearch() {
    const normalizedNum = normalizeOrderNumber(orderNumber);
    const normalizedPhone = phone.trim();

    if (!normalizedNum || !normalizedPhone) return;

    setLoading(true);
    setSearched(true);
    setOrder(null);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", normalizedNum)
      .eq("phone", normalizedPhone)
      .single();

    if (error && error.code !== "PGRST116") {
      alert("صار خطأ: " + error.message);
    }

    setOrder(data ?? null);
    setLoading(false);
  }

  const canSearch = orderNumber.trim().length > 0 && phone.trim().length > 0;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto mt-10 max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← العودة للرئيسية
        </Link>

        <div className="rounded-2xl bg-white/10 p-6">
          <h1 className="mb-1 text-2xl font-bold">تتبع الطلب</h1>
          <p className="mb-6 text-sm text-slate-400">
            أدخل رقم الطلب ورقم الهاتف لمعرفة حالة طلبك
          </p>

          <div className="flex flex-col gap-3">
            <input
              className="w-full rounded-lg border border-white/20 bg-transparent p-3 placeholder-slate-500 uppercase"
              placeholder="رقم الطلب — مثال: NQ-12 أو 12"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSearch && handleSearch()}
            />
            <input
              className="w-full rounded-lg border border-white/20 bg-transparent p-3 placeholder-slate-500"
              placeholder="رقم الهاتف المسجل في الطلب"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSearch && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !canSearch}
              className="w-full rounded-lg bg-cyan-600 p-3 font-bold hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? "جاري البحث..." : "تتبع الطلب"}
            </button>
          </div>

          <div className="mt-6">
            {loading && (
              <div className="py-8 text-center text-slate-400">جاري البحث...</div>
            )}

            {searched && !loading && !order && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="mb-2 text-2xl">🔍</p>
                <p className="text-slate-300">
                  لم نجد طلباً مطابقاً لرقم الطلب ورقم الهاتف
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  تأكد من الرقمين وحاول مجدداً
                </p>
              </div>
            )}

            {order && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/80">
                <div className="border-b border-white/10 bg-white/5 px-5 py-4">
                  <p className="mb-1 text-xs text-slate-500">رقم الطلب</p>
                  <p className="text-xl font-bold tracking-widest text-cyan-300">
                    {order.order_number}
                  </p>
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">الحالة</span>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-sm font-medium ${
                        statusColor[order.status] ??
                        "border-white/20 bg-white/10 text-white"
                      }`}
                    >
                      {statusArabic[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">الاسم</span>
                    <span className="text-sm font-medium">{order.customer_name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">نوع الخدمة</span>
                    <span className="text-sm font-medium">{order.service_type}</span>
                  </div>

                  {order.pickup_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">تاريخ الاستلام</span>
                      <span className="text-sm">
                        {formatDate(order.pickup_date)}
                        {order.pickup_time && ` — ${order.pickup_time.slice(0, 5)}`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">وقت التسليم المتوقع</span>
                    <span className="text-sm">
                      {order.expected_delivery_time ? (
                        formatDateTime(order.expected_delivery_time)
                      ) : (
                        <span className="text-slate-500">لم يتم تحديده بعد</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
