"use client";
import { useEffect, useRef, useState } from "react";
type Notice = {
  id: number;
  title: string;
  order_id: number;
  read_at: string | null;
};
export function AdminOrderAlerts({ onNewOrder }: { onNewOrder: () => void }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(false);
  const seen = useRef<Set<number> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const refresh = useRef(onNewOrder);
  useEffect(() => {
    refresh.current = onNewOrder;
  }, [onNewOrder]);
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const response = await fetch("/api/notifications/inbox", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (cancelled) return;
        const list: Notice[] = result.notifications ?? [];
        if (seen.current && list.some((n) => !seen.current!.has(n.id))) {
          refresh.current();
          if (sound && audio.current) {
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
        seen.current = new Set(list.map((n) => n.id));
        setNotices(list);
        setError("");
      } catch {
        if (!cancelled) setError("تنبيهات الطلبات غير متاحة حاليًا");
      }
    }
    poll();
    const timer = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sound]);
  async function enableSound() {
    audio.current ??= new AudioContext();
    await audio.current.resume();
    setSound(true);
  }
  async function markRead() {
    const response = await fetch("/api/notifications/inbox", {
      method: "PATCH",
    });
    if (response.ok)
      setNotices((ns) =>
        ns.map((n) => ({ ...n, read_at: new Date().toISOString() })),
      );
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
            {n.title} · NQ-{n.order_id}
          </p>
        ))}
      <p className="mt-2 text-xs text-slate-400">
        التنبيه هنا يعمل طالما لوحة الإدارة مفتوحة. إشعارات الهاتف بعد إغلاق
        التطبيق تحتاج تفعيل Firebase.
      </p>
    </section>
  );
}
