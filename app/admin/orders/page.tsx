"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ORDER_STATUSES, STATUS_LABELS, STATUS_BADGE, SERVICE_LABELS } from "@/lib/types";
import type { Order, Driver, OrderStatus } from "@/lib/types";

type EditForm = {
  customer_name: string;
  phone: string;
  address: string;
  service_type: string;
  status: OrderStatus;
  pickup_date: string;
  pickup_time: string;
  expected_delivery_time: string;
  notes: string;
  location_lat: string;
  location_lng: string;
  google_maps_link: string;
  assigned_driver_id: string;
  route_order: string;
  scheduled_at: string;
};

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "AlNaqaaAdmin2026";

const DONE_STATUSES = new Set<string>([
  "picked_up", "washing", "ready", "delivering", "completed", "delivered",
]);

function israelWhatsapp(phone: string) {
  return phone.replace(/^0/, "972").replace(/\D/g, "");
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function validDateValue(value: string | null): string {
  return value && value.includes("-") ? value : "";
}

function validDateTimeValue(value: string | null): string {
  return value && value.includes("-") ? value.slice(0, 16) : "";
}

const STATUS_FILTER_TABS = [
  { label: "الكل", value: "" },
  { label: "انتظار", value: "pending" },
  { label: "مجدول", value: "scheduled" },
  { label: "معين", value: "assigned" },
  { label: "في الطريق", value: "on_the_way,arrived" },
  { label: "غسيل", value: "picked_up,washing" },
  { label: "جاهز", value: "ready,delivering" },
  { label: "مكتمل", value: "completed,delivered" },
  { label: "ملغي", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [viewMode, setViewMode] = useState<"orders" | "program">("orders");
  const [routeOrderEdits, setRouteOrderEdits] = useState<Record<number, string>>({});
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
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
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  async function fetchDrivers() {
    const { data } = await supabase
      .from("drivers")
      .select("id,name,phone,is_active")
      .eq("is_active", true)
      .order("name");
    setDrivers((data as Driver[]) || []);
  }

  async function updateOrder(id: number, updates: Record<string, string | number | null>) {
    const { error } = await supabase.from("orders").update(updates).eq("id", id);
    if (error) { alert("صار خطأ: " + error.message); return; }
    fetchOrders();
  }

  async function logStatusHistory(orderId: number, status: OrderStatus) {
    await supabase.from("order_status_history").insert([
      { order_id: orderId, status, changed_by: "admin" },
    ]);
  }

  async function handleStatusChange(order: Order, newStatus: OrderStatus) {
    await updateOrder(order.id, { status: newStatus });
    await logStatusHistory(order.id, newStatus);
  }

  async function handleDriverAssign(order: Order, driverId: string) {
    const id = driverId === "" ? null : Number(driverId);
    const status: OrderStatus = id ? "assigned" : "scheduled";
    await updateOrder(order.id, { assigned_driver_id: id, status });
    if (id) await logStatusHistory(order.id, "assigned");
  }

  function saveRouteOrder(orderId: number, value: string) {
    const trimmed = value.trim();
    const num = trimmed === "" ? null : parseInt(trimmed, 10);
    if (trimmed !== "" && (isNaN(num!) || num! < 1)) return;
    updateOrder(orderId, { route_order: num });
    setRouteOrderEdits((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  }

  function openEdit(order: Order) {
    setEditingOrder(order);
    setEditForm({
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address ?? "",
      service_type: order.service_type,
      status: order.status,
      pickup_date: validDateValue(order.pickup_date),
      pickup_time: order.pickup_time ?? "",
      expected_delivery_time: validDateTimeValue(order.expected_delivery_time),
      notes: order.notes ?? "",
      location_lat: order.location_lat != null ? String(order.location_lat) : "",
      location_lng: order.location_lng != null ? String(order.location_lng) : "",
      google_maps_link: order.google_maps_link ?? "",
      assigned_driver_id: order.assigned_driver_id != null ? String(order.assigned_driver_id) : "",
      route_order: order.route_order != null ? String(order.route_order) : "",
      scheduled_at: validDateTimeValue(order.scheduled_at),
    });
  }

  async function saveEdit() {
    if (!editingOrder || !editForm) return;
    setEditSaving(true);
    const statusChanged = editForm.status !== editingOrder.status;
    const payload: Record<string, string | number | null> = {
      customer_name: editForm.customer_name.trim(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim() || null,
      service_type: editForm.service_type,
      status: editForm.status,
      pickup_date: editForm.pickup_date || null,
      pickup_time: editForm.pickup_time || null,
      expected_delivery_time: editForm.expected_delivery_time || null,
      notes: editForm.notes.trim() || null,
      location_lat: editForm.location_lat !== "" ? parseFloat(editForm.location_lat) : null,
      location_lng: editForm.location_lng !== "" ? parseFloat(editForm.location_lng) : null,
      google_maps_link: editForm.google_maps_link.trim() || null,
      assigned_driver_id: editForm.assigned_driver_id !== "" ? Number(editForm.assigned_driver_id) : null,
      route_order: editForm.route_order !== "" ? parseInt(editForm.route_order, 10) : null,
      scheduled_at: editForm.scheduled_at || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("orders").update(payload).eq("id", editingOrder.id);
    if (error) {
      alert("صار خطأ: " + error.message);
      setEditSaving(false);
      return;
    }
    if (statusChanged) await logStatusHistory(editingOrder.id, editForm.status);
    setEditingOrder(null);
    setEditForm(null);
    setEditSaving(false);
    fetchOrders();
  }

  async function deleteOrder(order: Order) {
    const label = order.order_number || `NQ-${order.id}`;
    if (!confirm(`هل أنت متأكد من حذف الطلب ${label}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    if (error) { alert("صار خطأ بالحذف: " + error.message); return; }
    fetchOrders();
  }

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const tabStatuses = statusTab ? statusTab.split(",") : [];

    return orders.filter((order) => {
      const orderDate =
        validDateValue(order.pickup_date) || order.created_at?.split("T")[0] || "";
      const matchesDate = selectedDate ? orderDate === selectedDate : true;
      const matchesTab = tabStatuses.length === 0 || tabStatuses.includes(order.status);
      const matchesDriver =
        !driverFilter
          ? true
          : driverFilter === "unassigned"
          ? !order.assigned_driver_id
          : order.assigned_driver_id === Number(driverFilter);

      const searchableText = [
        order.order_number,
        `NQ-${order.id}`,
        order.customer_name,
        order.phone,
        order.address,
        order.service_type,
        SERVICE_LABELS[order.service_type] ?? "",
        order.status,
        STATUS_LABELS[order.status as OrderStatus] ?? "",
        order.pickup_date,
        order.pickup_time,
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

      return matchesDate && matchesSearch && matchesTab && matchesDriver;
    });
  }, [orders, selectedDate, searchTerm, statusTab, driverFilter]);

  // Driver daily program — grouped by driver, sorted by route_order
  const driverPrograms = useMemo(() => {
    const dateFiltered = selectedDate
      ? orders.filter((o) => {
          const d = validDateValue(o.pickup_date) || o.created_at?.split("T")[0] || "";
          return d === selectedDate;
        })
      : orders;

    const map = new Map<number, { driver: Driver; driverOrders: Order[] }>();
    dateFiltered.forEach((o) => {
      if (!o.assigned_driver_id) return;
      const driver = drivers.find((d) => d.id === o.assigned_driver_id);
      if (!driver) return;
      if (!map.has(o.assigned_driver_id)) {
        map.set(o.assigned_driver_id, { driver, driverOrders: [] });
      }
      map.get(o.assigned_driver_id)!.driverOrders.push(o);
    });

    map.forEach(({ driverOrders }) => {
      driverOrders.sort((a, b) => {
        if (a.route_order != null && b.route_order != null)
          return a.route_order - b.route_order;
        if (a.route_order != null) return -1;
        if (b.route_order != null) return 1;
        return a.id - b.id;
      });
    });

    return Array.from(map.values());
  }, [orders, drivers, selectedDate]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      visible: filteredOrders.length,
      pending: orders.filter((o) => o.status === "pending" || o.status === "scheduled").length,
      active: orders.filter((o) =>
        ["assigned", "on_the_way", "arrived", "picked_up", "washing", "delivering"].includes(
          o.status
        )
      ).length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter(
        (o) => o.status === "completed" || o.status === "delivered"
      ).length,
    }),
    [orders, filteredOrders]
  );

  const calendarDates = Array.from(
    new Set(
      orders
        .map((o) => validDateValue(o.pickup_date) || o.created_at?.split("T")[0])
        .filter(Boolean)
    )
  ).sort() as string[];

  function driverName(id: number | null): string | null {
    if (!id) return null;
    return drivers.find((d) => d.id === id)?.name ?? null;
  }

  if (!authenticated) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
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
                } else alert("كلمة السر غير صحيحة");
              }
            }}
            className="mb-4 w-full rounded-lg bg-slate-800 p-3 text-white outline-none"
          />
          <button
            onClick={() => {
              if (password === ADMIN_PASSWORD) {
                localStorage.setItem("admin-authenticated", "true");
                setAuthenticated(true);
              } else alert("كلمة السر غير صحيحة");
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">لوحة الطلبات</h1>
          <p className="text-sm text-slate-400">مغسلة النقاء</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setViewMode("orders")}
              className={`px-3 py-2 text-sm font-bold transition-colors ${
                viewMode === "orders"
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              الطلبات
            </button>
            <button
              onClick={() => setViewMode("program")}
              className={`px-3 py-2 text-sm font-bold transition-colors ${
                viewMode === "program"
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📋 البرنامج اليومي
            </button>
          </div>
          <Link
            href="/admin/drivers"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-slate-600"
          >
            السائقون
          </Link>
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
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-6">
        {[
          { label: "إجمالي", value: stats.total, color: "text-white" },
          { label: "معروض", value: stats.visible, color: "text-cyan-300" },
          { label: "انتظار", value: stats.pending, color: "text-yellow-300" },
          { label: "نشط", value: stats.active, color: "text-blue-300" },
          { label: "جاهز", value: stats.ready, color: "text-green-300" },
          { label: "مكتمل", value: stats.completed, color: "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/8 p-3 md:p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold md:text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {calendarDates.length > 0 && (
        <div className="mb-6 rounded-xl bg-white/8 p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-300">رزنامة الطلبات</h2>
          <div className="flex flex-wrap gap-2">
            {calendarDates.map((date) => {
              const count = orders.filter((o) => {
                const d =
                  validDateValue(o.pickup_date) || o.created_at?.split("T")[0] || "";
                return d === date;
              }).length;
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-lg px-3 py-2 text-sm text-right ${
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
      <div className="mb-4 rounded-xl bg-white/8 p-4">
        <div className="grid gap-3 md:grid-cols-3">
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
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
          >
            <option value="">كل السائقين</option>
            <option value="unassigned">بدون سائق</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setSelectedDate("")}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
          >
            كل التواريخ
          </button>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedDate(todayDate());
              setStatusTab("");
              setDriverFilter("");
            }}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* ─── PROGRAM VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === "program" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-bold">برنامج السائقين اليومي</h2>
            {selectedDate && (
              <span className="rounded-full bg-cyan-600/20 px-3 py-1 text-sm text-cyan-300">
                {selectedDate}
              </span>
            )}
          </div>

          {driverPrograms.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-8 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-slate-400">لا يوجد سائقون لديهم طلبات في هذا التاريخ.</p>
              <p className="mt-1 text-sm text-slate-500">اختر تاريخاً مختلفاً أو تحقق من تعيين الطلبات.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {driverPrograms.map(({ driver, driverOrders }) => {
                const completed = driverOrders.filter((o) =>
                  DONE_STATUSES.has(o.status)
                ).length;
                const remaining = driverOrders.length - completed;
                const progress =
                  driverOrders.length > 0
                    ? Math.round((completed / driverOrders.length) * 100)
                    : 0;

                return (
                  <div
                    key={driver.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                  >
                    {/* Driver header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
                      <div>
                        <p className="text-lg font-bold">🚗 {driver.name}</p>
                        <p className="text-sm text-slate-400">{driver.phone}</p>
                      </div>
                      <div className="flex gap-4 text-center">
                        <div>
                          <p className="text-xl font-bold text-white">{driverOrders.length}</p>
                          <p className="text-xs text-slate-400">إجمالي</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-green-400">{completed}</p>
                          <p className="text-xs text-slate-400">منجز</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-yellow-400">{remaining}</p>
                          <p className="text-xs text-slate-400">متبقي</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-white/10">
                      <div
                        className="h-full bg-cyan-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Order rows */}
                    <div className="divide-y divide-white/5">
                      {driverOrders.map((order, idx) => {
                        const isDone = DONE_STATUSES.has(order.status);
                        return (
                          <div
                            key={order.id}
                            className={`flex items-center gap-3 px-4 py-3 ${
                              isDone ? "opacity-60" : ""
                            }`}
                          >
                            {/* Stop number / route_order input */}
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                                  isDone
                                    ? "bg-green-600/30 text-green-400"
                                    : "bg-cyan-600/20 text-cyan-300"
                                }`}
                              >
                                {isDone ? "✓" : order.route_order ?? idx + 1}
                              </span>
                              <p className="text-[10px] text-slate-500">محطة</p>
                            </div>

                            {/* Route order edit input */}
                            <input
                              type="number"
                              min="1"
                              max="99"
                              placeholder="—"
                              value={
                                routeOrderEdits[order.id] ??
                                (order.route_order != null ? String(order.route_order) : "")
                              }
                              onChange={(e) =>
                                setRouteOrderEdits((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              onBlur={(e) => saveRouteOrder(order.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  saveRouteOrder(order.id, (e.target as HTMLInputElement).value);
                              }}
                              title="ترتيب المسار"
                              className="w-14 rounded-lg bg-slate-800 p-1.5 text-center text-sm text-white outline-none"
                            />

                            {/* Order info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-bold text-cyan-300">
                                  {order.order_number || `NQ-${order.id}`}
                                </span>
                                <span className="font-medium text-sm">
                                  {order.customer_name}
                                </span>
                                {order.pickup_time && (
                                  <span className="text-xs text-slate-400">
                                    {order.pickup_time.slice(0, 5)}
                                  </span>
                                )}
                              </div>
                              {order.address && (
                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                  {order.address}
                                </p>
                              )}
                            </div>

                            {/* Status badge */}
                            <span
                              className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                STATUS_BADGE[order.status as OrderStatus] ??
                                "border-white/20 bg-white/10 text-white"
                              }`}
                            >
                              {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── EDIT MODAL ───────────────────────────────────────────────────────── */}
      {editingOrder && editForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-8">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">تعديل الطلب</h2>
                <p className="text-sm text-slate-400 font-mono">
                  {editingOrder.order_number || `NQ-${editingOrder.id}`}
                </p>
              </div>
              <button
                onClick={() => { setEditingOrder(null); setEditForm(null); }}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
              >
                إلغاء ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">اسم العميل *</span>
                <input
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm((f) => f && { ...f, customer_name: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">الهاتف *</span>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => f && { ...f, phone: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                  dir="ltr"
                />
              </label>

              <label className="col-span-full flex flex-col gap-1">
                <span className="text-xs text-slate-400">العنوان</span>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => f && { ...f, address: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">نوع الخدمة</span>
                <select
                  value={editForm.service_type}
                  onChange={(e) => setEditForm((f) => f && { ...f, service_type: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                >
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">الحالة</span>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => f && { ...f, status: e.target.value as OrderStatus })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                  <option value="delivered">تم التسليم (قديم)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">السائق</span>
                <select
                  value={editForm.assigned_driver_id}
                  onChange={(e) => setEditForm((f) => f && { ...f, assigned_driver_id: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                >
                  <option value="">بدون سائق</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">ترتيب المسار</span>
                <input
                  type="number"
                  min="1"
                  value={editForm.route_order}
                  onChange={(e) => setEditForm((f) => f && { ...f, route_order: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                  placeholder="—"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">تاريخ الاستلام</span>
                <input
                  type="date"
                  value={editForm.pickup_date}
                  onChange={(e) => setEditForm((f) => f && { ...f, pickup_date: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">وقت الاستلام</span>
                <input
                  type="time"
                  value={editForm.pickup_time}
                  onChange={(e) => setEditForm((f) => f && { ...f, pickup_time: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">وقت التسليم المتوقع</span>
                <input
                  type="datetime-local"
                  value={editForm.expected_delivery_time}
                  onChange={(e) => setEditForm((f) => f && { ...f, expected_delivery_time: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">مجدول في</span>
                <input
                  type="datetime-local"
                  value={editForm.scheduled_at}
                  onChange={(e) => setEditForm((f) => f && { ...f, scheduled_at: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                />
              </label>

              <label className="col-span-full flex flex-col gap-1">
                <span className="text-xs text-slate-400">رابط الخريطة</span>
                <input
                  value={editForm.google_maps_link}
                  onChange={(e) => setEditForm((f) => f && { ...f, google_maps_link: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                  dir="ltr"
                  placeholder="https://maps.google.com/..."
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">خط العرض (Lat)</span>
                <input
                  type="number"
                  step="any"
                  value={editForm.location_lat}
                  onChange={(e) => setEditForm((f) => f && { ...f, location_lat: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                  dir="ltr"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">خط الطول (Lng)</span>
                <input
                  type="number"
                  step="any"
                  value={editForm.location_lng}
                  onChange={(e) => setEditForm((f) => f && { ...f, location_lng: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none"
                  dir="ltr"
                />
              </label>

              <label className="col-span-full flex flex-col gap-1">
                <span className="text-xs text-slate-400">ملاحظات</span>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => f && { ...f, notes: e.target.value })}
                  className="rounded-lg bg-slate-800 p-2.5 text-sm text-white outline-none resize-none"
                />
              </label>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={() => { setEditingOrder(null); setEditForm(null); }}
                className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-bold hover:bg-slate-600"
              >
                إلغاء
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-bold hover:bg-cyan-500 disabled:opacity-50"
              >
                {editSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ORDERS VIEW ──────────────────────────────────────────────────────── */}
      {viewMode === "orders" && (
        <>
          {/* Status Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {STATUS_FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusTab === tab.value
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {loading ? (
            <p className="text-slate-400">جاري تحميل الطلبات...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-slate-400">لا توجد طلبات مطابقة.</p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const driver = driverName(order.assigned_driver_id);
                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-xl border border-white/8 bg-white/5"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-white/8 bg-white/5 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-lg font-bold text-cyan-300">
                          {order.order_number || `NQ-${order.id}`}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_BADGE[order.status as OrderStatus] ??
                            "border-white/20 bg-white/10 text-white"
                          }`}
                        >
                          {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                        </span>
                        {driver && (
                          <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-300">
                            🚗 {driver}
                            {order.route_order != null && (
                              <span className="mr-1 opacity-70">
                                · محطة {order.route_order}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {SERVICE_LABELS[order.service_type] ?? order.service_type}
                        </span>
                        <button
                          onClick={() => openEdit(order)}
                          className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-bold hover:bg-cyan-700 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => deleteOrder(order)}
                          className="rounded-lg bg-red-900/60 px-3 py-1 text-xs font-bold hover:bg-red-700 transition-colors"
                        >
                          حذف
                        </button>
                      </div>
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
                        {order.address && (
                          <div className="flex gap-2">
                            <span className="w-16 shrink-0 text-slate-400">العنوان</span>
                            <span>{order.address}</span>
                          </div>
                        )}
                        {order.scheduled_at && (
                          <div className="flex gap-2">
                            <span className="w-16 shrink-0 text-slate-400">مجدول</span>
                            <span className="text-blue-300">
                              {order.scheduled_at.slice(0, 16).replace("T", " — ")}
                            </span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="flex gap-2">
                            <span className="w-16 shrink-0 text-slate-400">ملاحظات</span>
                            <span className="text-yellow-200">{order.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Google Maps */}
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
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-400">الحالة</span>
                          <select
                            value={order.status || "pending"}
                            onChange={(e) =>
                              handleStatusChange(order, e.target.value as OrderStatus)
                            }
                            className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                            <option value="delivered">تم التسليم (قديم)</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-400">السائق</span>
                          <select
                            value={order.assigned_driver_id ?? ""}
                            onChange={(e) => handleDriverAssign(order, e.target.value)}
                            className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                          >
                            <option value="">بدون سائق</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-400">ترتيب المسار</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="—"
                            value={
                              routeOrderEdits[order.id] ??
                              (order.route_order != null ? String(order.route_order) : "")
                            }
                            onChange={(e) =>
                              setRouteOrderEdits((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                            onBlur={(e) => saveRouteOrder(order.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                saveRouteOrder(
                                  order.id,
                                  (e.target as HTMLInputElement).value
                                );
                            }}
                            className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-400">تاريخ الاستلام</span>
                          <input
                            type="date"
                            value={validDateValue(order.pickup_date)}
                            onChange={(e) =>
                              updateOrder(order.id, { pickup_date: e.target.value || null })
                            }
                            className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-400">وقت الاستلام</span>
                          <input
                            type="time"
                            value={order.pickup_time || ""}
                            onChange={(e) =>
                              updateOrder(order.id, { pickup_time: e.target.value || null })
                            }
                            className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-400">وقت التسليم المتوقع</span>
                          <input
                            type="datetime-local"
                            value={validDateTimeValue(order.expected_delivery_time)}
                            onChange={(e) =>
                              updateOrder(order.id, {
                                expected_delivery_time: e.target.value || null,
                              })
                            }
                            className="rounded-lg bg-slate-800 p-2 text-sm text-white"
                          />
                        </label>
                      </div>

                      {/* WhatsApp */}
                      <div className="mt-3">
                        <a
                          href={`https://wa.me/${israelWhatsapp(order.phone)}?text=${encodeURIComponent(
                            `مرحباً ${order.customer_name}، بخصوص طلبك رقم ${
                              order.order_number || `NQ-${order.id}`
                            } من مغسلة النقاء.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.854L.057 23.882l6.187-1.621A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892a9.877 9.877 0 01-5.031-1.376l-.361-.214-3.735.979 1.005-3.645-.235-.374A9.861 9.861 0 012.108 12C2.108 6.527 6.527 2.108 12 2.108c5.473 0 9.892 4.419 9.892 9.892 0 5.473-4.419 9.892-9.892 9.892z" />
                          </svg>
                          واتساب
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
