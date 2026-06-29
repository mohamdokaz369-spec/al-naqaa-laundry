"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  service_type: string;
  status: string;
  pickup_date: string;
  pickup_time: string;
  expected_delivery_time: string;
  created_at: string;
  order_number: string;
};

const statuses = [
  { value: "pending", label: "بانتظار الاستلام" },
  { value: "picked_up", label: "تم الاستلام" },
  { value: "washing", label: "قيد الغسيل" },
  { value: "ready", label: "جاهز للتسليم" },
  { value: "delivered", label: "تم التسليم" },
];

const statusArabic: Record<string, string> = {
  pending: "بانتظار الاستلام",
  picked_up: "تم الاستلام",
  washing: "قيد الغسيل",
  ready: "جاهز للتسليم",
  delivered: "تم التسليم",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("صار خطأ بتحميل الطلبات: " + error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  async function updateOrder(
    id: number,
    field: "status" | "pickup_date" | "pickup_time" | "expected_delivery_time",
    value: string
  ) {
    const { error } = await supabase
      .from("orders")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      alert("صار خطأ: " + error.message);
      return;
    }

    fetchOrders();
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-6 text-3xl font-bold">لوحة طلبات مغسلة النقاء</h1>

      {loading ? (
        <p>جاري تحميل الطلبات...</p>
      ) : orders.length === 0 ? (
        <p>لا توجد طلبات حتى الآن.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl bg-white/10 p-4">
              <p><b>رقم الطلب لليوم:</b> #{order.id}</p>
              <p><b>رقم الطلب:</b> {order.order_number || `NQ-${order.id}`}</p>
              <p><b>الاسم:</b> {order.customer_name}</p>
              <p><b>الهاتف:</b> {order.phone}</p>
              <p><b>العنوان:</b> {order.address}</p>
              <p><b>الخدمة:</b> {order.service_type}</p>

              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-bold">الحالة</span>
                  <select
                    value={order.status || "pending"}
                    onChange={(e) =>
                      updateOrder(order.id, "status", e.target.value)
                    }
                    className="rounded-lg bg-slate-800 p-2 text-white"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-bold">تاريخ الاستلام</span>
                  <input
                    type="date"
                    value={order.pickup_date || ""}
                    onChange={(e) =>
                      updateOrder(order.id, "pickup_date", e.target.value)
                    }
                    className="rounded-lg bg-slate-800 p-2 text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-bold">وقت الاستلام</span>
                  <input
                    type="time"
                    value={order.pickup_time || ""}
                    onChange={(e) =>
                      updateOrder(order.id, "pickup_time", e.target.value)
                    }
                    className="rounded-lg bg-slate-800 p-2 text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-bold">وقت التسليم المتوقع</span>
                  <input
                    type="datetime-local"
                    value={order.expected_delivery_time || ""}
                    onChange={(e) =>
                      updateOrder(
                        order.id,
                        "expected_delivery_time",
                        e.target.value
                      )
                    }
                    className="rounded-lg bg-slate-800 p-2 text-white"
                  />
                </label>
              </div>

              <p className="mt-3 text-sm text-slate-300">
                الحالة الحالية: {statusArabic[order.status] || order.status}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                التسليم المتوقع:{" "}
                {order.expected_delivery_time || "لم يتم تحديده بعد"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}