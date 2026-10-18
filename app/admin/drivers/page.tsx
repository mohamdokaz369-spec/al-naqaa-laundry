"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Driver } from "@/lib/types";
import { normalizePhone } from "@/lib/phone";
import { ToastBanner } from "@/components/Toast";
import type { ToastState } from "@/components/Toast";

// Same reasoning as app/admin/orders/page.tsx.
export const dynamic = "force-dynamic";

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [formError, setFormError] = useState("");

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const router = useRouter();
  // Same defense-in-depth re-check as app/admin/orders/page.tsx.
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/admin/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!cancelled) setCheckingAuth(false);
    }
    checkAuth();
    return () => { cancelled = true; };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  async function fetchDrivers() {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("name");
    if (error) {
      setToast({ type: "error", message: "حدث خطأ أثناء تحميل السائقين" });
    } else {
      setDrivers((data as Driver[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (checkingAuth) return;
    // Deferred one microtask so the data fetch's setState calls aren't
    // read as synchronous within the effect body itself
    // (react-hooks/set-state-in-effect) — fetchDrivers() is also called
    // from several click handlers below, so it stays a normal
    // async/await function rather than being rewritten just for this.
    Promise.resolve().then(() => fetchDrivers());
  }, [checkingAuth]);

  async function addDriver() {
    setFormError("");
    if (!newName.trim()) { setFormError("الاسم مطلوب"); return; }
    if (!normalizePhone(newPhone)) { setFormError("الهاتف مطلوب"); return; }

    setSaving(true);
    const { error } = await supabase.from("drivers").insert([{
      name: newName.trim(),
      phone: normalizePhone(newPhone),
    }]);
    setSaving(false);

    if (error) {
      setFormError("حدث خطأ أثناء الحفظ");
      return;
    }

    setNewName("");
    setNewPhone("");
    setShowForm(false);
    setToast({ type: "success", message: "تم إضافة السائق بنجاح" });
    fetchDrivers();
  }

  const [deleting, setDeleting] = useState<number | null>(null);

  async function deleteDriver(driver: Driver) {
    if (!confirm(`هل أنت متأكد من حذف هذا السائق؟\n${driver.name}`)) return;

    setDeleting(driver.id);

    // Check for active assigned orders
    const { data: activeOrders, error: checkError } = await supabase
      .from("orders")
      .select("id")
      .eq("assigned_driver_id", driver.id)
      .not("status", "in", '("completed","cancelled","delivered")')
      .limit(1);

    if (checkError) {
      setToast({ type: "error", message: "حدث خطأ أثناء التحقق من الطلبات" });
      setDeleting(null);
      return;
    }

    if (activeOrders && activeOrders.length > 0) {
      setToast({
        type: "warning",
        message: "لا يمكن حذف السائق لأنه مرتبط بطلبات نشطة. قم بإلغاء تعيين الطلبات أولاً أو عطّل السائق.",
      });
      setDeleting(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("drivers")
      .delete()
      .eq("id", driver.id);

    if (deleteError) {
      setToast({ type: "error", message: "حدث خطأ أثناء الحذف" });
    } else {
      setToast({ type: "success", message: `تم حذف السائق ${driver.name} بنجاح` });
      fetchDrivers();
    }
    setDeleting(null);
  }

  async function toggleActive(driver: Driver) {
    const { error } = await supabase
      .from("drivers")
      .update({ is_active: !driver.is_active })
      .eq("id", driver.id);
    if (error) setToast({ type: "error", message: "حدث خطأ أثناء التحديث" });
    else fetchDrivers();
  }

  if (checkingAuth) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">جاري التحقق من الصلاحية...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <ToastBanner toast={toast} onDismiss={dismissToast} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة السائقين</h1>
          <p className="text-sm text-slate-400">مغسلة النقاء</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/orders"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-slate-600"
          >
            الطلبات
          </Link>
          <button
            onClick={logout}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-red-700"
          >
            خروج
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{drivers.length} سائق مسجل</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold hover:bg-cyan-500"
        >
          {showForm ? "إلغاء" : "+ إضافة سائق"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white/8 p-4">
          <h2 className="mb-4 font-bold">سائق جديد</h2>
          <div className="flex flex-col gap-3">
            <input
              className="rounded-lg border border-white/20 bg-transparent p-3 text-white placeholder-slate-500"
              placeholder="الاسم الكامل"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="rounded-lg border border-white/20 bg-transparent p-3 text-white placeholder-slate-500"
              placeholder="رقم الهاتف"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            {formError && <p className="text-sm text-red-400">{formError}</p>}
            <button
              onClick={addDriver}
              disabled={saving}
              className="rounded-lg bg-cyan-600 p-3 font-bold hover:bg-cyan-500 disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl bg-white/5 p-10 text-center">
          <p className="text-slate-400">جاري تحميل السائقين...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-xl bg-white/5 p-10 text-center">
          <p className="mb-1 text-2xl">🚗</p>
          <p className="text-slate-300">لا يوجد سائقون مسجلون</p>
          <p className="mt-1 text-sm text-slate-500">أضف أول سائق باستخدام الزر أعلاه</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drivers.map((d) => (
            <div
              key={d.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                d.is_active
                  ? "border-white/10 bg-white/5"
                  : "border-white/5 bg-white/2 opacity-60"
              }`}
            >
              <div>
                <p className="font-bold">{d.name}</p>
                <p className="text-sm text-slate-400">{d.phone}</p>
                {d.last_location_update && (
                  <p className="mt-1 text-xs text-slate-500">
                    آخر موقع: {new Date(d.last_location_update).toLocaleString("ar-SA")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(d)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    d.is_active
                      ? "bg-red-700/30 text-red-300 hover:bg-red-700/50"
                      : "bg-green-700/30 text-green-300 hover:bg-green-700/50"
                  }`}
                >
                  {d.is_active ? "تعطيل" : "تفعيل"}
                </button>
                <button
                  onClick={() => deleteDriver(d)}
                  disabled={deleting === d.id}
                  className="rounded-lg bg-red-900/50 px-3 py-1.5 text-sm font-bold text-red-300 hover:bg-red-700/70 disabled:opacity-40 transition-colors"
                >
                  {deleting === d.id ? "..." : "حذف السائق"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
