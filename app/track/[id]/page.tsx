"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { STATUS_LABELS, STATUS_BADGE } from "@/lib/types";
import type { Order, OrderStatus } from "@/lib/types";
import { businessWhatsAppUrl } from "@/lib/whatsapp";

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

        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            onClick={refreshOrder}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-400 hover:bg-white/10"
          >
            تحديث الآن
          </button>
          <a
            href={businessWhatsAppUrl(`مرحبا، أريد الاستفسار عن طلبي رقم ${order.order_number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:bg-green-500"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.854L.057 23.882l6.187-1.621A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892a9.877 9.877 0 01-5.031-1.376l-.361-.214-3.735.979 1.005-3.645-.235-.374A9.861 9.861 0 012.108 12C2.108 6.527 6.527 2.108 12 2.108c5.473 0 9.892 4.419 9.892 9.892 0 5.473-4.419 9.892-9.892 9.892z" />
            </svg>
            تواصل مع المغسلة عبر واتساب
          </a>
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
