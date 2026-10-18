"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DRIVER_STATUS_ACTIONS, STATUS_LABELS, STATUS_BADGE } from "@/lib/types";
import type { Order, OrderStatus } from "@/lib/types";
import { optimizeRoute } from "@/lib/route-optimizer";
import { businessClock } from "@/lib/business-hours";
import { whatsappUrl } from "@/lib/whatsapp";

// Same reasoning as app/admin/orders/page.tsx.
export const dynamic = "force-dynamic";

type DriverIdentity = {
  id: number;
  name: string;
  phone: string;
};

// All statuses visible in the driver's daily program
const DRIVER_PROGRAM_STATUSES: OrderStatus[] = [
  "assigned",
  "on_the_way",
  "arrived",
  "picked_up",
  "washing",
  "ready",
  "delivering",
  "completed",
];

// Statuses that count as a completed stop for progress tracking
const DONE_STATUSES = new Set<string>([
  "picked_up",
  "washing",
  "ready",
  "delivering",
  "completed",
  "delivered",
]);

// Sort orders: route_order first (nulls last), then haversine fallback
function sortByRouteOrder(
  orders: Order[],
  driverLat?: number,
  driverLng?: number
): Order[] {
  const withRoute = orders
    .filter((o) => o.route_order != null)
    .sort((a, b) => (a.route_order ?? 0) - (b.route_order ?? 0));
  const withoutRoute = orders.filter((o) => o.route_order == null);
  const sortedWithout =
    driverLat != null && driverLng != null
      ? optimizeRoute(withoutRoute, driverLat, driverLng)
      : withoutRoute;
  return [...withRoute, ...sortedWithout];
}

export default function DriverPage() {
  const router = useRouter();

  // Identity now comes from the signed-in Supabase Auth user (via
  // middleware.ts -> profiles.role === 'driver' -> profiles.driver_id),
  // not from a phone number typed into a form with no verification.
  // This re-check here is defense-in-depth for an already-open tab whose
  // session expired; the real gate is middleware + RLS.
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [driver, setDriver] = useState<DriverIdentity | null>(null);

  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const locationWatchRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadDriver() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/driver/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, driver_id")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "driver" || !profile.driver_id) {
        await supabase.auth.signOut();
        router.replace("/driver/login?error=unauthorized");
        return;
      }

      const { data: driverRow } = await supabase
        .from("drivers")
        .select("id, name, phone, is_active")
        .eq("id", profile.driver_id)
        .single();

      if (!driverRow || !driverRow.is_active) {
        await supabase.auth.signOut();
        router.replace("/driver/login?error=unauthorized");
        return;
      }

      if (!cancelled) {
        setDriver({ id: driverRow.id, name: driverRow.name, phone: driverRow.phone });
        setCheckingAuth(false);
      }
    }
    loadDriver();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!driver) return;
    fetchOrders(driver.id);
    startLocationTracking(driver.id);
    const timer = setInterval(() => fetchOrders(driver.id), 30000);
    return () => {
      clearInterval(timer);
      if (locationWatchRef.current !== null)
        navigator.geolocation.clearWatch(locationWatchRef.current);
    };
  }, [driver]);

  async function fetchOrders(driverId: number) {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("assigned_driver_id", driverId)
      .in("status", DRIVER_PROGRAM_STATUSES)
      .order("route_order", { ascending: true });
    if (error) setError("تعذر تحديث البرنامج، حاول مجددًا");
    else { setError(""); setOrders(((data as Order[]) || []).filter(o => o.pickup_date === businessClock().date || !["completed", "delivered", "cancelled"].includes(o.status))); }
    setOrdersLoading(false);
  }

  function startLocationTracking(driverId: number) {
    if (!navigator.geolocation) return;

    async function pushLocation(lat: number, lng: number) {
      const { error } = await supabase
        .from("drivers")
        .update({
          current_lat: lat,
          current_lng: lng,
          last_location_update: new Date().toISOString(),
        })
        .eq("id", driverId);
      if (error) setError("تعذر إرسال موقعك");
    }

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDriverLocation({ lat, lng });
        pushLocation(lat, lng);
      },
      () => setError("تعذر تحديد الموقع. اسمح بالوصول للموقع من إعدادات المتصفح."),
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
  }

  async function updateStatus(order: Order, newStatus: OrderStatus) {
    setUpdating(order.id);
    try {
      const response = await fetch("/api/mobile/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: newStatus, expected_status: order.status }),
      });
      if (!response.ok) throw new Error("status_update_failed");
      await fetchOrders(driver!.id);
    } catch {
      setError("تعذر تغيير الحالة أو تغيّرت من جهاز آخر. حدّث البرنامج وحاول مجددًا.");
    } finally {
      setUpdating(null);
    }
  }

  async function logout() {
    if (locationWatchRef.current !== null)
      navigator.geolocation.clearWatch(locationWatchRef.current);
    await supabase.auth.signOut();
    router.push("/driver/login");
  }

  // ── Loading / auth check ───────────────────────────────────────────────────
  if (checkingAuth || !driver) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">جاري التحقق من الصلاحية...</p>
      </div>
    );
  }

  // ── Driver dashboard ──────────────────────────────────────────────────────────
  const sortedOrders = sortByRouteOrder(orders, driverLocation?.lat, driverLocation?.lng);
  const totalStops = sortedOrders.length;
  const completedStops = sortedOrders.filter((o) => DONE_STATUSES.has(o.status)).length;
  const remainingStops = totalStops - completedStops;
  const currentStop = sortedOrders.find((o) => !DONE_STATUSES.has(o.status));
  const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 pb-10 text-white">

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-950 p-4">{error}</p>}
      {/* ── Header card ────────────────────────────────────────────────────── */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-start justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">مرحباً {driver.name} 👋</h1>
            <p className="text-sm text-slate-400">{driver.phone}</p>
            <p className="mt-1 text-xs text-slate-500">
              {driverLocation ? "📍 موقعك محدد" : "⏳ جاري تحديد موقعك..."}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-red-700"
          >
            خروج
          </button>
        </div>

        {/* Progress stats */}
        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/5 border-t border-white/5">
          <div className="p-3 text-center">
            <p className="text-2xl font-bold">{totalStops}</p>
            <p className="text-xs text-slate-400">إجمالي</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{completedStops}</p>
            <p className="text-xs text-slate-400">منجز</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{remainingStops}</p>
            <p className="text-xs text-slate-400">متبقي</p>
          </div>
        </div>

        {/* Progress bar */}
        {totalStops > 0 && (
          <div className="h-2 bg-white/10">
            <div
              className="h-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Program label ──────────────────────────────────────────────────── */}
      {totalStops > 0 && (
        <p className="mb-3 text-sm font-bold text-slate-400 px-1">
          الطلبات الحالية — {totalStops} {totalStops === 1 ? "محطة" : "محطات"}
        </p>
      )}

      {/* ── Order cards ────────────────────────────────────────────────────── */}
      {ordersLoading ? (
        <div className="rounded-2xl bg-white/5 p-8 text-center">
          <p className="text-slate-400">جاري تحميل البرنامج...</p>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="rounded-2xl bg-white/5 p-8 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-bold text-slate-200">لا توجد طلبات معينة لك اليوم.</p>
          <p className="mt-1 text-sm text-slate-400">تواصل مع الإدارة للحصول على برنامجك.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order, index) => {
            const isCompleted = DONE_STATUSES.has(order.status);
            const isCurrent = order.id === currentStop?.id;
            const actions = DRIVER_STATUS_ACTIONS[order.status as OrderStatus] ?? [];
            const stopNum = index + 1;

            return (
              <div
                key={order.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-950/30"
                    : isCompleted
                    ? "border-white/5 bg-white/3 opacity-60"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {/* Stop header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b ${
                    isCurrent
                      ? "border-cyan-500/30 bg-cyan-500/10"
                      : "border-white/5 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isCompleted
                          ? "bg-green-600/30 text-green-400"
                          : isCurrent
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {isCompleted ? "✓" : stopNum}
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-400">محطة {stopNum}</p>
                      <p className="font-mono font-bold text-cyan-300 text-base leading-tight">
                        {order.order_number || `NQ-${order.id}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                      STATUS_BADGE[order.status as OrderStatus] ??
                      "border-white/20 bg-white/10 text-white"
                    }`}
                  >
                    {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                  </span>
                </div>

                {/* Order details */}
                <div className="space-y-2.5 p-4 text-sm">
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">الاسم</span>
                    <span className="font-bold text-base">{order.customer_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">الهاتف</span>
                    <a
                      href={`tel:${order.phone}`}
                      className="font-medium text-cyan-400 underline underline-offset-2"
                    >
                      {order.phone}
                    </a>
                  </div>
                  {order.address && (
                    <div className="flex gap-2">
                      <span className="w-16 shrink-0 text-slate-400">العنوان</span>
                      <span>{order.address}</span>
                    </div>
                  )}
                  {order.pickup_date && (
                    <div className="flex gap-2">
                      <span className="w-16 shrink-0 text-slate-400">الموعد</span>
                      <span>
                        {order.pickup_date}
                        {order.pickup_time && ` — ${order.pickup_time.slice(0, 5)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">الخدمة</span>
                    <span>{order.service_type}</span>
                  </div>
                  {order.notes && (
                    <div className="flex gap-2">
                      <span className="w-16 shrink-0 text-slate-400">ملاحظات</span>
                      <span className="text-yellow-200">{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Utility buttons: Maps / Call / WhatsApp */}
                <div className="flex gap-2 px-4 pb-3">
                  {order.google_maps_link && (
                    <a
                      href={order.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-700 py-3 text-sm font-bold hover:bg-blue-600 active:scale-95"
                    >
                      📍 الخريطة
                    </a>
                  )}
                  <a
                    href={`tel:${order.phone}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-700 py-3 text-sm font-bold hover:bg-slate-600 active:scale-95"
                  >
                    📞 اتصال
                  </a>
                  <a
                    href={whatsappUrl(order.phone, `مرحبا، أنا سائق مغسلة النقاء. أنا في الطريق لاستلام طلبك رقم ${order.order_number || `NQ-${order.id}`}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-700 py-3 text-sm font-bold hover:bg-green-600 active:scale-95"
                  >
                    💬 واتساب
                  </a>
                </div>

                {/* Status action buttons */}
                {actions.length > 0 && (
                  <div className="flex gap-2 px-4 pb-4">
                    {actions.map((action) => (
                      <button
                        key={action.next}
                        onClick={() => updateStatus(order, action.next)}
                        disabled={updating === order.id}
                        className={`flex-1 rounded-xl py-4 text-base font-bold text-white transition-all active:scale-95 disabled:opacity-50 ${action.color}`}
                      >
                        {updating === order.id ? "..." : action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
