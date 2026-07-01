"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { STATUS_LABELS, STATUS_BADGE } from "@/lib/types";
import type { Order, OrderStatus } from "@/lib/types";

function normalizeOrderNumber(input: string): string {
  const s = decodeURIComponent(input).trim();
  if (/^NQ-\d+$/i.test(s)) return s.toUpperCase();
  const nqNoDash = s.match(/^nq(\d+)$/i);
  if (nqNoDash) return `NQ-${nqNoDash[1]}`;
  const num = s.replace(/^#/, "").match(/^\d+$/);
  if (num) return `NQ-${num[0]}`;
  return s.toUpperCase();
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dtStr: string | null): string | null {
  if (!dtStr) return null;
  try {
    return new Date(dtStr).toLocaleString("ar-SA", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return dtStr;
  }
}

const DRIVER_VISIBLE_STATUSES: OrderStatus[] = ["on_the_way", "arrived", "delivering"];

export default function TrackPage() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const orderNum = normalizeOrderNumber(rawId ?? "");

  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");
  const refreshRef = useRef<NodeJS.Timeout | null>(null);

  async function verify() {
    setVerifyError("");
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) { setVerifyError("أدخل رقم هاتفك"); return; }

    setVerifying(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNum)
      .eq("phone", trimmedPhone)
      .single();
    setVerifying(false);

    if (!data) {
      setVerifyError("رقم الهاتف لا يطابق رقم الطلب");
      return;
    }

    setOrder(data as Order);
    setVerified(true);
  }

  async function refreshOrder() {
    if (!order) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order.id)
      .single();
    if (data) setOrder(data as Order);
  }

  useEffect(() => {
    if (!verified) return;
    refreshRef.current = setInterval(refreshOrder, 30000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [verified, order?.id]);

  if (!orderNum) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <p className="text-slate-400">رقم الطلب غير صحيح.</p>
      </div>
    );
  }

  if (!verified) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            ← الرئيسية
          </Link>

          <div className="rounded-2xl bg-white/10 p-6">
            <div className="mb-4 text-center text-3xl">📦</div>
            <h1 className="mb-1 text-center text-2xl font-bold">تتبع الطلب</h1>
            <p className="mb-1 text-center font-mono text-lg text-cyan-300">{orderNum}</p>
            <p className="mb-6 text-center text-sm text-slate-400">
              أدخل رقم هاتفك للتحقق من هويتك
            </p>

            <input
              className="mb-3 w-full rounded-lg border border-white/20 bg-transparent p-3 text-white placeholder-slate-500"
              placeholder="رقم الهاتف المسجل في الطلب"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
            />
            {verifyError && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {verifyError}
              </p>
            )}
            <button
              onClick={verify}
              disabled={verifying}
              className="w-full rounded-lg bg-cyan-600 p-3 font-bold hover:bg-cyan-500 disabled:opacity-50"
            >
              {verifying ? "جاري التحقق..." : "عرض الطلب"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <p className="text-red-400">{loadError}</p>
      </div>
    );
  }

  if (!order) return null;

  const status = order.status as OrderStatus;
  const showDriverETA = DRIVER_VISIBLE_STATUSES.includes(status);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← الرئيسية
        </Link>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {/* Header */}
          <div className="border-b border-white/10 bg-white/5 px-5 py-4">
            <p className="mb-1 text-xs text-slate-500">رقم الطلب</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-cyan-300">
              {order.order_number}
            </p>
          </div>

          {/* Status */}
          <div className="border-b border-white/10 px-5 py-4">
            <p className="mb-2 text-xs text-slate-500">الحالة الحالية</p>
            <span
              className={`inline-block rounded-full border px-4 py-1.5 text-sm font-bold ${
                STATUS_BADGE[status] ?? "border-white/20 bg-white/10 text-white"
              }`}
            >
              {STATUS_LABELS[status] ?? order.status}
            </span>

            {showDriverETA && (
              <div className="mt-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3">
                <p className="text-sm font-medium text-cyan-300">
                  🚗 السائق في الطريق إليك
                </p>
                {order.estimated_arrival && (
                  <p className="mt-1 text-xs text-slate-400">
                    الوصول المتوقع: {formatDateTime(order.estimated_arrival)}
                  </p>
                )}
              </div>
            )}

            {status === "completed" || status === "delivered" ? (
              <div className="mt-3 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
                <p className="text-sm font-medium text-green-300">✓ تم إنجاز طلبك بنجاح</p>
              </div>
            ) : null}

            {status === "cancelled" && (
              <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
                <p className="text-sm font-medium text-red-300">تم إلغاء الطلب</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 px-5 py-4">
            <DetailRow label="الاسم" value={order.customer_name} />
            <DetailRow label="الخدمة" value={order.service_type} />

            {order.pickup_date && (
              <DetailRow
                label="موعد الاستلام"
                value={`${formatDate(order.pickup_date)}${order.pickup_time ? ` — ${order.pickup_time.slice(0, 5)}` : ""}`}
              />
            )}

            <DetailRow
              label="التسليم المتوقع"
              value={
                order.expected_delivery_time
                  ? formatDateTime(order.expected_delivery_time) ?? "—"
                  : "لم يتم تحديده بعد"
              }
              muted={!order.expected_delivery_time}
            />
          </div>

          {/* Auto-refresh note */}
          <div className="border-t border-white/10 px-5 py-3">
            <p className="text-center text-xs text-slate-600">
              يتحدث تلقائياً كل 30 ثانية
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={refreshOrder}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-400 hover:bg-white/10"
          >
            تحديث الآن
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string | null;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-400">{label}</span>
      <span className={`text-right text-sm ${muted ? "text-slate-500" : "font-medium"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}
