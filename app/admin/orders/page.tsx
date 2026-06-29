"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  service_type: string;
  status: string;
  pickup_date: string;
  pickup_time: string;
  expected_delivery_time: string;
  created_at: string;
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

function israelWhatsapp(phone: string) {
  return phone.replace(/^0/, "972").replace(/\D/g, "");
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const orderDate =
        order.pickup_date || order.created_at?.split("T")[0] || "";

      const matchesDate = selectedDate ? orderDate === selectedDate : true;

      const searchableText = [
        order.order_number,
        `NQ-${order.id}`,
        order.customer_name,
        order.phone,
        order.address,
        order.service_type,
        order.status,
        statusArabic[order.status],
        order.pickup_date,
        order.pickup_time,
        order.expected_delivery_time,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const normalizedQuery = q.replace("#", "");

      const matchesSearch =
        !q ||
        searchableText.includes(q) ||
        searchableText.includes(normalizedQuery) ||
        searchableText.includes(`nq-${normalizedQuery}`);

      return matchesDate && matchesSearch;
    });
  }, [orders, selectedDate, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      visible: filteredOrders.length,
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      washing: filteredOrders.filter((o) => o.status === "washing").length,
      ready: filteredOrders.filter((o) => o.status === "ready").length,
      delivered: filteredOrders.filter((o) => o.status === "delivered").length,
    };
  }, [orders, filteredOrders]);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-6 text-3xl font-bold">لوحة طلبات مغسلة النقاء</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-sm text-slate-300">إجمالي الطلبات</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-sm text-slate-300">النتائج المعروضة</p>
          <p className="text-3xl font-bold">{stats.visible}</p>
        </div>

        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-sm text-slate-300">بانتظار الاستلام</p>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>

        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-sm text-slate-300">قيد الغسيل</p>
          <p className="text-3xl font-bold">{stats.washing}</p>
        </div>

        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-sm text-slate-300">جاهز للتسليم</p>
          <p className="text-3xl font-bold">{stats.ready}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl bg-white/10 p-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-bold">بحث عام</span>
          <input
            type="text"
            placeholder="ابحث برقم الطلب، الاسم، الهاتف، العنوان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg bg-slate-800 p-2 text-white outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-bold">اختر يوم الطلبات</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg bg-slate-800 p-2 text-white outline-none"
          />
        </label>

        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={() => setSelectedDate("")}
            className="rounded-lg bg-slate-700 px-4 py-2"
          >
            عرض كل التواريخ
          </button>

          <button
            onClick={() => setSearchTerm("")}
            className="rounded-lg bg-slate-700 px-4 py-2"
          >
            مسح البحث
          </button>
        </div>
      </div>

      {loading ? (
        <p>جاري تحميل الطلبات...</p>
      ) : filteredOrders.length === 0 ? (
        <p>لا توجد طلبات مطابقة.</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-xl bg-white/10 p-4">
              <p>
                <b>رقم الطلب:</b> {order.order_number || `NQ-${order.id}`}
              </p>
              <p>
                <b>الاسم:</b> {order.customer_name}
              </p>
              <p>
                <b>الهاتف:</b> {order.phone}
              </p>
              <p>
                <b>العنوان:</b> {order.address}
              </p>
              <p>
                <b>الخدمة:</b> {order.service_type}
              </p>

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

              <a
                href={`https://wa.me/${israelWhatsapp(
                  order.phone
                )}?text=${encodeURIComponent(
                  `مرحباً ${order.customer_name}، بخصوص طلبك رقم ${
                    order.order_number || `NQ-${order.id}`
                  } من مغسلة النقاء.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 font-bold text-white"
              >
                تواصل واتساب
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}