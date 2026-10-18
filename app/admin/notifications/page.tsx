"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type State = {
  configured: { push: boolean; whatsapp: boolean; worker: boolean };
  queueAvailable: boolean;
  queue: { channel: string; status: string; last_error: string | null }[];
};
export default function Notifications() {
  const [state, setState] = useState<State | null>(null),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const response = await fetch("/api/notifications/status");
      if (!response.ok) throw new Error();
      setState(await response.json());
    } catch {
      setMessage("تعذر تحميل إعدادات الإشعارات");
    }
  }
  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications/status")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const value = await response.json();
        if (!cancelled) setState(value);
      })
      .catch(() => {
        if (!cancelled) setMessage("تعذر تحميل إعدادات الإشعارات");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  async function retry() {
    setMessage("");
    try {
      const ready = await fetch("/api/notifications/status", {
        method: "POST",
      });
      if (!ready.ok) throw new Error();
      const response = await fetch("/api/notifications/dispatch", {
        method: "POST",
      });
      if (!response.ok) throw new Error();
      await load();
      setMessage("تم فحص طابور الإرسال. الحالات غير المهيأة تبقى محفوظة.");
    } catch {
      setMessage("تعذر تشغيل الإرسال");
    }
  }
  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin/orders">← لوحة الطلبات</Link>
        <h1 className="my-6 text-2xl font-bold">
          الإشعارات والرسائل التلقائية
        </h1>
        {message && (
          <p role="status" className="my-4">
            {message}
          </p>
        )}
        {state && (
          <>
            <ul className="space-y-3 rounded-xl bg-slate-900 p-6">
              <li>
                إشعارات الهاتف:{" "}
                {state.configured.push
                  ? "إعداد الخادم موجود، يحتاج اختبار هاتف"
                  : "بانتظار إعداد Firebase"}
              </li>
              <li>
                واتساب:{" "}
                {state.configured.whatsapp
                  ? "إعداد الخادم موجود، يحتاج اختبار القوالب"
                  : "بانتظار ربط WhatsApp Business Platform"}
              </li>
              <li>
                إعادة المحاولة بالخلفية:{" "}
                {state.configured.worker
                  ? "مفتاح المشغّل موجود؛ تأكد من تشغيل الجدولة"
                  : "بانتظار تهيئة المشغّل"}
              </li>
              <li>
                قاعدة الإشعارات:{" "}
                {state.queueAvailable
                  ? "متاحة"
                  : "تحديث قاعدة البيانات غير جاهز"}
              </li>
            </ul>
            <p className="my-4">
              آخر {state.queue.length} عملية:{" "}
              {state.queue.filter((j) => j.status === "sent").length} مرسلة ·{" "}
              {state.queue.filter((j) => j.status === "blocked").length} تنتظر
              الإعداد ·{" "}
              {state.queue.filter((j) => j.status === "failed").length} تحتاج
              مراجعة.
            </p>
            <button
              className="rounded-xl bg-cyan-700 px-5 py-3"
              onClick={retry}
            >
              إرسال العمليات المعلّقة بعد تهيئة الخدمات
            </button>
            <p className="mt-4 text-sm text-slate-400">
              لا يعاد تلقائيًا إرسال عملية نتيجتها غير مؤكدة، لتقليل احتمال
              تكرار الرسالة. لا تُعرض مفاتيح الخدمات هنا.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
