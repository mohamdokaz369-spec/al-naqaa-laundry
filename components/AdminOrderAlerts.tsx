"use client";
import { useEffect, useRef, useState } from "react";
type Notice = {
  id: number;
  title: string;
  order_id: number;
  read_at: string | null;
};
export function AdminOrderAlerts({ onNewOrder, onOpenOrder }: { onNewOrder: () => void; onOpenOrder: (id: number) => void }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(false);
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const openOrder = useRef(onOpenOrder);
  useEffect(() => { openOrder.current = onOpenOrder; }, [onOpenOrder]);
  const seen = useRef<Set<number> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const refresh = useRef(onNewOrder);
  useEffect(() => {
    refresh.current = onNewOrder;
  }, [onNewOrder]);
  useEffect(() => {
    let cancelled = false;
    let loading = false;
    const controller = new AbortController();
    async function poll() {
      if (loading) return;
      loading = true;
      try {
        const response = await fetch("/api/notifications/inbox", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (cancelled) return;
        const list: Notice[] = result.notifications ?? [];
        const incoming = seen.current ? list.filter((n) => !n.read_at && !seen.current!.has(n.id)) : [];
        if (incoming.length) {
          refresh.current();
          if (browserEnabled && "Notification" in window && Notification.permission === "granted") {
            for (const notice of incoming) {
              try {
                const notification = new Notification("وصل طلب جديد للمغسلة", { body: `رقم الطلب NQ-${notice.order_id}`, tag: `order-${notice.order_id}` });
                notification.onclick = () => { window.focus(); openOrder.current(notice.order_id); notification.close(); };
              } catch { /* Some mobile browsers require a push service worker. Inbox remains available. */ }
            }
          }
          if (sound && audio.current?.state === "running") {
            const oscillator = audio.current.createOscillator(),
              gain = audio.current.createGain();
            oscillator.connect(gain);
            gain.connect(audio.current.destination);
            gain.gain.value = 0.12;
            oscillator.frequency.value = 880;
            oscillator.start();
            oscillator.stop(audio.current.currentTime + 0.3);
          }
        }
        seen.current ??= new Set();
        for (const notice of list) seen.current.add(notice.id);
        setNotices(list);
        setError("");
      } catch {
        if (!cancelled) setError("تنبيهات الطلبات غير متاحة حاليًا");
      } finally { loading = false; }
    }
    poll();
    const timer = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      controller.abort();
    };
  }, [sound, browserEnabled]);
  async function enableSound() {
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setSound(true);
    } catch { setError("تعذر تشغيل الصوت في هذا المتصفح"); }
  }
  async function enableBrowser() {
    if (!("Notification" in window)) { setError("هذا المتصفح لا يدعم إشعارات الصفحة؛ استخدم التنبيه داخل اللوحة"); return; }
    try {
      const permission = await Notification.requestPermission();
      setBrowserEnabled(permission === "granted");
      if (permission !== "granted") setError("اسمح بالإشعارات من إعدادات الموقع في المتصفح");
    } catch { setError("تعذر تفعيل إشعارات المتصفح"); }
  }
  async function markRead() {
    try {
    const response = await fetch("/api/notifications/inbox", {
      method: "PATCH",
    });
    if (response.ok)
      setNotices((ns) =>
        ns.map((n) => ({ ...n, read_at: new Date().toISOString() })),
      );
    else setError("تعذر تحديد الإشعارات كمقروءة");
    } catch { setError("تعذر الاتصال؛ حاول مرة أخرى"); }
  }
  return (
    <section
      className="mb-4 rounded-xl border border-cyan-800 bg-slate-900 p-4"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <strong>
          🔔 طلبات جديدة: {notices.filter((n) => !n.read_at).length}
        </strong>
        <button
          onClick={() => (sound ? setSound(false) : enableSound())}
          className="rounded bg-cyan-800 px-3 py-2"
        >
          {sound ? "كتم الصوت" : "تفعيل صوت الطلب الجديد"}
        </button>
        <button onClick={enableBrowser} disabled={browserEnabled} className="rounded bg-cyan-800 px-3 py-2">{browserEnabled ? "إشعارات المتصفح مفعّلة لهذه الجلسة" : "تفعيل إشعارات المتصفح"}</button>
        <button onClick={markRead} className="rounded bg-slate-700 px-3 py-2">
          تحديد كمقروء
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {notices
        .filter((n) => !n.read_at)
        .slice(0, 3)
        .map((n) => (
          <p key={n.id} className="mt-2">
            <button className="underline" onClick={() => onOpenOrder(n.order_id)}>{n.title} · NQ-{n.order_id} — فتح الطلب</button>
          </p>
        ))}
      <p className="mt-2 text-xs text-slate-400">
        التنبيه يعمل طالما لوحة الإدارة مفتوحة، وقد يتأخر في الخلفية. الإشعار بعد إغلاق الموقع بالكامل لم يُفعّل بعد.
      </p>
    </section>
  );
}
