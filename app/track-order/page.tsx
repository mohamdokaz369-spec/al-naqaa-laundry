"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  service_type: string;
  status: string;
  expected_delivery_time: string;
  created_at: string;
};

const statusArabic: Record<string, string> = {
  pending: "بانتظار الاستلام",
  picked_up: "تم الاستلام",
  washing: "قيد الغسيل",
  ready: "جاهز للتسليم",
  delivered: "تم التسليم",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function searchOrders() {
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .order("created_at", { ascending: false });

    if (error) {
      alert("صار خطأ: " + error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white/10 p-6">
        <h1 className="mb-4 text-3xl font-bold">تتبع الطلب</h1>
        <p className="mb-6 text-slate-300">أدخل رقم الطلب لمعرفة حالته.</p>

        <input
          className="mb-4 w-full rounded-lg border border-white/20 bg-transparent p-3"
          placeholder="مثال: NQ-12"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />

        <button
          onClick={searchOrders}
          disabled={loading || !orderNumber}
          className="w-full rounded-lg bg-cyan-600 p-3 font-bold disabled:opacity-50"
        >
          {loading ? "جاري البحث..." : "تتبع الطلب"}
        </button>

        <div className="mt-6 space-y-4">
          {searched && orders.length === 0 && !loading && (
            <p className="text-slate-300">لا يوجد طلب بهذا الرقم.</p>
          )}

          {orders.map((order) => (
            <div key={order.id} className="rounded-xl bg-slate-900 p-4">
              <p><b>رقم الطلب:</b> {order.order_number}</p>
              <p><b>الاسم:</b> {order.customer_name}</p>
              <p><b>العنوان:</b> {order.address}</p>
              <p><b>الخدمة:</b> {order.service_type}</p>
              <p><b>الحالة:</b> {statusArabic[order.status] || order.status}</p>
              <p><b>وقت التسليم المتوقع:</b> {order.expected_delivery_time || "لم يتم تحديده بعد"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}