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
  pickup_date: string | null;
  pickup_time: string | null;
  expected_delivery_time: string | null;
  notes: string | null;
  location_lat: number | null;
  location_lng: number | null;
  google_maps_link: string | null;
  created_at: string;
};

const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "AlNaqaaAdmin2026";

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

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  picked_up: "bg-blue-500/20 text-blue-300",
  washing: "bg-purple-500/20 text-purple-300",
  ready: "bg-green-500/20 text-green-300",
  delivered: "bg-slate-500/20 text-slate-400",
};

const serviceArabic: Record<string, string> = {
  pickup_request: "طلب استلام",
  غسيل: "غسيل",
  كي: "كي",
  "غسيل + كي": "غسيل + كي",
  "تنظيف جاف": "تنظيف جاف",
  سجاد: "سجاد",
  كنب: "كنب",
  بطانيات: "بطانيات",
};

function israelWhatsapp(phone: string) {
  return phone.replace(/^0/, "972").replace(/\D/g, "");
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function validDateValue(value: string | null) {
  return value && value.includes("-") ? value : "";
}

function validDateTimeValue(value: string | null) {
  return value && value.includes("-") ? value.slice(0, 16) : "";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [searchTerm, setSearchTerm] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin-authenticated") === "true";
  });

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
      .update({ [field]: value || null })
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
        validDateValue(order.pickup_date) ||
        order.created_at?.split("T")[0] ||
        "";

      const matchesDate = selectedDate ? orderDate === selectedDate : true;

      const searchableText = [
        order.order_number,
        `NQ-${order.id}`,
        order.customer_name,
        order.phone,
        order.address,
        order.service_type,
        serviceArabic[order.service_type] ?? "",
        order.status,
        statusArabic[order.status],
        order.pickup_date,
        order.pickup_time,
        order.expected_delivery_time,
        order.notes,
        order.google_maps_link,
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

  const calendarDates = Array.from(
    new Set(
      orders
        .map(
          (order) =>
            validDateValue(order.pickup_date) ||
            order.created_at?.split("T")[0]
        )
        .filter(Boolean)
    )
  ).sort();

  if (!authenticated) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"
      >
        <div className="w-full max-w-sm rounded-2xl bg-white/10 p-6">
          <h1 className="mb-1 text-2xl font-bold">لوحة الإدارة</h1>
          <p className="mb-6 text-sm text-slate-400">مغسلة النقاء</p>

          <input
            type="password"
            placeholder="كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (password === ADMIN_PASSWORD) {
                  localStorage.setItem("admin-authenticated", "true");
                  setAuthenticated(true);
                } else {
                  alert("كلمة السر غير صحيحة");
                }
              }
            }}
            className="mb-4 w-full rounded-lg bg-slate-800 p-3 text-white outline-none"
          />

          <button
            onClick={() => {
              if (password === ADMIN_PASSWORD) {
                localStorage.setItem("admin-authenticated", "true");
                setAuthenticated(true);
              } else {
                alert("كلمة السر غير صحيحة");
              }
            }}
            className="w-full rounded-lg bg-cyan-600 p-3 font-bold hover:bg-cyan-500"
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة الطلبات</h1>
          <p className="text-sm text-slate-400">مغسلة النقاء</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("admin-authenticated");
            setAuthenticated(false);
          }}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-red-700"
        >
          خروج
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "إجمالي", value: stats.total, color: "text-white" },
          { label: "معروض", value: stats.visible, color: "text-cyan-300" },
          { label: "انتظار", value: stats.pending, color: "text-yellow-300" },
          { label: "غسيل", value: stats.washing, color: "text-purple-300" },
          { label: "جاهز", value: stats.ready, color: "text-green-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/8 p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {calendarDates.length > 0 && (
        <div className="mb-6 rounded-xl bg-white/8 p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-300">رزنامة الطلبات</h2>
          <div className="flex flex-wrap gap-2">
            {calendarDates.map((date) => {
              const count = orders.filter((order) => {
                const orderDate =
                  validDateValue(order.pickup_date) ||
                  order.created_at?.split("T")[0] ||
                  "";
                return orderDate === date;
              }).length;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-lg px-3 py-2 text-right text-sm ${
                    selectedDate === date
                      ? "bg-cyan-600 font-bold"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  <span className="font-medium">{date}</span>
                  <span className="mr-2 text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="mb-6 rounded-xl bg-white/8 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="ابحث برقم الطلب، الاسم، الهاتف، العنوان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none placeholder-slate-500"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setSelectedDate("")}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
          >
            كل التواريخ
          </button>
          <button
            onClick={() => { setSearchTerm(""); setSelectedDate(todayDate()); }}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* Orders */}
      {loading ? (
        <p className="text-slate-400">جاري تحميل الطلبات...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-slate-400">لا توجد طلبات مطابقة.</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-white/8 bg-white/5 overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/8 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-cyan-300">
                    {order.order_number || `NQ-${order.id}`}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[order.status] ?? "bg-white/10 text-white"}`}>
                    {statusArabic[order.status] ?? order.status}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {serviceArabic[order.service_type] ?? order.service_type}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="mb-3 grid gap-1 text-sm">
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">الاسم</span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">الهاتف</span>
                    <span>{order.phone}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">العنوان</span>
                    <span>{order.address}</span>
                  </div>
                  {order.notes && (
                    <div className="flex gap-2">
                      <span className="w-16 shrink-0 text-slate-400">ملاحظات</span>
                      <span className="text-yellow-200">{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Google Maps button */}
                {order.google_maps_link && (
                  <div className="mb-3">
                    <a
                      href={order.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      فتح الموقع على الخريطة
                    </a>
                  </div>
                )}

                {/* Editable Fields */}
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">الحالة</span>
                    <select
                      value={order.status || "pending"}
                      onChange={(e) => updateOrder(order.id, "status", e.target.value)}
                      className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                    >
                      {statuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">تاريخ الاستلام</span>
                    <input
                      type="date"
                      value={validDateValue(order.pickup_date)}
                      onChange={(e) => updateOrder(order.id, "pickup_date", e.target.value)}
                      className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">وقت الاستلام</span>
                    <input
                      type="time"
                      value={order.pickup_time || ""}
                      onChange={(e) => updateOrder(order.id, "pickup_time", e.target.value)}
                      className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">وقت التسليم المتوقع</span>
                    <input
                      type="datetime-local"
                      value={validDateTimeValue(order.expected_delivery_time)}
                      onChange={(e) =>
                        updateOrder(order.id, "expected_delivery_time", e.target.value)
                      }
                      className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                    />
                  </label>
                </div>

                {/* WhatsApp */}
                <div className="mt-3">
                  <a
                    href={`https://wa.me/${israelWhatsapp(order.phone)}?text=${encodeURIComponent(
                      `مرحباً ${order.customer_name}، بخصوص طلبك رقم ${order.order_number || `NQ-${order.id}`} من مغسلة النقاء.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.854L.057 23.882l6.187-1.621A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892a9.877 9.877 0 01-5.031-1.376l-.361-.214-3.735.979 1.005-3.645-.235-.374A9.861 9.861 0 012.108 12C2.108 6.527 6.527 2.108 12 2.108c5.473 0 9.892 4.419 9.892 9.892 0 5.473-4.419 9.892-9.892 9.892z"/>
                    </svg>
                    واتساب
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
