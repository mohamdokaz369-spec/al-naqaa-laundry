"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "loading";

export type ToastState = {
  type: ToastType;
  message: string;
};

type Props = {
  toast: ToastState | null;
  onDismiss: () => void;
};

const STYLES: Record<ToastType, string> = {
  success: "bg-green-900/95 border-green-500/40 text-green-100",
  error:   "bg-red-950/95 border-red-500/40 text-red-100",
  warning: "bg-yellow-900/95 border-yellow-500/40 text-yellow-100",
  loading: "bg-slate-800/95 border-slate-500/40 text-slate-100",
};

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
  loading: "…",
};

export function ToastBanner({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast || toast.type === "loading") return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      dir="rtl"
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 left-6 z-[200] flex max-w-xs items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm md:max-w-sm ${STYLES[toast.type]}`}
    >
      <span className="mt-0.5 shrink-0 text-sm font-extrabold leading-none">
        {ICONS[toast.type]}
      </span>
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      {toast.type !== "loading" && (
        <button
          onClick={onDismiss}
          aria-label="إغلاق"
          className="mt-0.5 shrink-0 text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}
