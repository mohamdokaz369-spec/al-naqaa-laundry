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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("order");
    if (fromQuery) {
      setOrderNumber(fromQuery);
      searchByNumber(fromQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchByNumber(num: string) {
    const q = num.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setOrder(null);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", q)
      .single();

    if (error && error.code !== "PGRST116") {
      alert("صار خطأ: " + error.message);
    }

    setOrder(data ?? null);
    setLoading(false);
  }

  function handleSearch() {
    searchByNumber(orderNumber);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto mt-10 max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          ← العودة للرئيسية
        </Link>

        <div className="rounded-2xl bg-white/10 p-6">
          <h1 className="mb-1 text-2xl font-bold">تتبع الطلب</h1>
          <p className="mb-6 text-sm text-slate-400">أدخل رقم الطلب لمعرفة حالته</p>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-white/20 bg-transparent p-3 uppercase placeholder-slate-500"
              placeholder="مثال: NQ-12"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !orderNumber.trim()}
              className="rounded-lg bg-cyan-600 px-5 font-bold disabled:opacity-50 hover:bg-cyan-500"
            >
              {loading ? "..." : "بحث"}
            </button>
          </div>

          <div className="mt-6">
            {loading && (
              <div className="py-8 text-center text-slate-400">جاري البحث...</div>
            )}

            {searched && !loading && !order && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-slate-300">لا يوجد طلب بهذا الرقم</p>
                <p className="mt-1 text-sm text-slate-500">تأكد من الرقم وحاول مجدداً</p>
              </div>
            )}

            {order && (
              <div className="rounded-xl border border-white/10 bg-slate-900/80 overflow-hidden">
                <div className="border-b border-white/10 bg-white/5 px-5 py-4">
                  <p className="text-xs text-slate-500 mb-1">رقم الطلب</p>
                  <p className="text-xl font-bold tracking-widest text-cyan-300">{order.order_number}</p>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">الحالة</span>
                    <span className={`rounded-full border px-3 py-0.5 text-sm font-medium ${statusColor[order.status] ?? "bg-white/10 text-white border-white/20"}`}>
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
                      {order.expected_delivery_time
                        ? formatDateTime(order.expected_delivery_time)
                        : <span className="text-slate-500">لم يتم تحديده بعد</span>
                      }
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
