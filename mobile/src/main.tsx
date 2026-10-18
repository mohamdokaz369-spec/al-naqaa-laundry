import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { FormEvent } from "react";
import { api, auth, enablePush, disablePush, listenForPush } from "./api";
import { orderRequestKey } from "../../lib/order-request";
import { businessClock } from "../../lib/business-hours";
import {
  DRIVER_STATUS_ACTIONS,
  STATUS_LABELS,
  SERVICE_LABELS,
  ORDER_STATUSES,
} from "../../lib/types";
import type { Order, OrderStatus } from "../../lib/types";
import "./style.css";
type Screen = "home" | "booking" | "tracking" | "staff";
function App() {
  const [screen, setScreen] = useState<Screen>("home"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState<"admin" | "driver" | null>(null);
  const [orders, setOrders] = useState<Order[]>([]),
    [tracked, setTracked] = useState<Partial<Order> | null>(null);
  const [trackNumber, setTrackNumber] = useState(""),
    [trackPhone, setTrackPhone] = useState("");
  const [pushToken, setPushToken] = useState(
    () => localStorage.getItem("naqaa-push-token") ?? "",
  );
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let disposed = false;
    void listenForPush()
      .then((stop) => {
        if (disposed) stop();
        else cleanup = stop;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    service_type: "غسيل",
    pickup_date: businessClock().date,
    pickup_time: "10:00",
    notes: "",
    whatsapp_opt_in: false,
  });
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إكمال العملية");
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    const result = await api("/api/mobile/orders");
    setOrders(result.orders ?? []);
    setRole(result.role);
  }
  useEffect(() => {
    let cancelled = false;
    if (auth)
      void auth.auth.getSession().then(({ data }) => {
        if (data.session && !cancelled) void refresh().catch(() => {});
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const open = () => {
      setScreen("staff");
      void refresh().catch(() => {});
    };
    window.addEventListener("naqaa-open-orders", open);
    return () => window.removeEventListener("naqaa-open-orders", open);
  }, []);
  useEffect(() => {
    if (screen !== "staff" || !role) return;
    const timer = setInterval(() => {
      void refresh().catch(() =>
        setMessage("تعذر تحديث الطلبات، تحقق من الاتصال"),
      );
    }, 15000);
    return () => clearInterval(timer);
  }, [screen, role]);
  async function book(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const key = await orderRequestKey(form, sessionStorage);
      const result = await api("/api/orders", form, "POST", {
        "Idempotency-Key": key,
      });
      sessionStorage.removeItem("naqaa-order-request");
      setTrackNumber(result.orderNumber);
      setTrackPhone(form.phone);
      setScreen("tracking");
      setMessage(
        `تم تسجيل طلبك ${result.orderNumber}. الدفع نقدًا عند التسليم.`,
      );
    });
  }
  async function track(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const result = await api("/api/track", {
        order_number: trackNumber,
        phone: trackPhone,
      });
      setTracked(result.order);
    });
  }
  async function login(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      if (!auth)
        throw new Error("إعداد تسجيل الدخول غير مكتمل، تواصل مع الإدارة");
      const result = await auth.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (result.error) throw new Error("البريد أو كلمة المرور غير صحيحة");
      try {
        await refresh();
        setPassword("");
      } catch (error) {
        await auth.auth.signOut();
        throw error;
      }
    });
  }
  async function logout() {
    await run(async () => {
      try {
        if (pushToken) await disablePush(pushToken);
      } finally {
        await auth?.auth.signOut();
        localStorage.removeItem("naqaa-push-token");
        setPushToken("");
        setRole(null);
        setOrders([]);
      }
    });
  }
  function change(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <>
      <header>
        <button className="brand" onClick={() => setScreen("home")}>
          🧺 النقاء<span>Al Naqaa Laundry</span>
        </button>
        <span className="hours">يوميًا 9–18</span>
      </header>
      <main>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {screen === "home" && (
          <>
            <section className="hero">
              <small>مغسلة النقاء · عرابة</small>
              <h1>نظافة تريح بالك.</h1>
              <p>
                احجز الاستلام وتابع طلبك من تلفونك.
                <br />
                بدون حساب، والدفع نقدًا عند التسليم.
              </p>
              <button className="primary" onClick={() => setScreen("booking")}>
                اطلب استلام جديد ←
              </button>
              <button onClick={() => setScreen("tracking")}>تابع طلبك</button>
            </section>
            <section className="services">
              {["غسيل", "تنظيف جاف", "سجاد آلي", "بطانيات"].map((service) => (
                <article key={service}>
                  <span>✦</span>
                  <h3>{SERVICE_LABELS[service]}</h3>
                </article>
              ))}
            </section>
            <a
              className="whatsapp"
              href="https://wa.me/972527983320"
              target="_blank"
              rel="noreferrer"
            >
              تواصل معنا على واتساب ↗
            </a>
          </>
        )}
        {screen === "booking" && (
          <>
            <h1>طلب استلام</h1>
            <p>أدخل التفاصيل وسنتواصل لتأكيد الموعد.</p>
            <form onSubmit={book}>
              <label>
                الاسم
                <input
                  value={form.customer_name}
                  onChange={(e) => change("customer_name", e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                الهاتف
                <input
                  value={form.phone}
                  onChange={(e) => change("phone", e.target.value)}
                  required
                  type="tel"
                  autoComplete="tel"
                  dir="ltr"
                />
              </label>
              <label>
                العنوان
                <input
                  value={form.address}
                  onChange={(e) => change("address", e.target.value)}
                  required
                  maxLength={300}
                  autoComplete="street-address"
                />
              </label>
              <label>
                الخدمة
                <select
                  value={form.service_type}
                  onChange={(e) => change("service_type", e.target.value)}
                >
                  {Object.entries(SERVICE_LABELS)
                    .filter(([k]) => k !== "pickup_request")
                    .map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                </select>
              </label>
              <div className="two">
                <label>
                  تاريخ الاستلام
                  <input
                    type="date"
                    min={businessClock().date}
                    value={form.pickup_date}
                    onChange={(e) => change("pickup_date", e.target.value)}
                    required
                  />
                </label>
                <label>
                  الوقت
                  <input
                    type="time"
                    min="09:00"
                    max="17:59"
                    value={form.pickup_time}
                    onChange={(e) => change("pickup_time", e.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                ملاحظات
                <textarea
                  value={form.notes}
                  onChange={(e) => change("notes", e.target.value)}
                  maxLength={500}
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.whatsapp_opt_in}
                  onChange={(e) => change("whatsapp_opt_in", e.target.checked)}
                />
                أوافق على تأكيد الطلب وتحديثات حالته عبر واتساب. اختياري.
              </label>
              <button className="primary" disabled={busy}>
                {busy ? "جارٍ الإرسال…" : "تأكيد طلب الاستلام"}
              </button>
            </form>
          </>
        )}
        {screen === "tracking" && (
          <>
            <h1>وين صار طلبك؟</h1>
            <form onSubmit={track}>
              <label>
                رقم الطلب
                <input
                  value={trackNumber}
                  onChange={(e) => {
                    setTrackNumber(e.target.value);
                    setTracked(null);
                  }}
                  placeholder="NQ-12"
                  required
                  dir="ltr"
                />
              </label>
              <label>
                الهاتف المسجل
                <input
                  type="tel"
                  value={trackPhone}
                  onChange={(e) => {
                    setTrackPhone(e.target.value);
                    setTracked(null);
                  }}
                  required
                  dir="ltr"
                />
              </label>
              <button className="primary" disabled={busy}>
                تتبع الطلب
              </button>
            </form>
            {tracked && (
              <article className="order">
                <small>{tracked.order_number}</small>
                <h2>{STATUS_LABELS[tracked.status as OrderStatus]}</h2>
                <p>
                  {tracked.service_type} · {tracked.pickup_date}
                </p>
                <p>الدفع نقدًا عند التسليم</p>
              </article>
            )}
          </>
        )}
        {screen === "staff" && (
          <>
            <h1>
              {role === "admin"
                ? "طلبات المغسلة"
                : role === "driver"
                  ? "برنامج السائق"
                  : "دخول فريق النقاء"}
            </h1>
            {!role ? (
              <form onSubmit={login}>
                <label>
                  البريد
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </label>
                <label>
                  كلمة المرور
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
                <button className="primary" disabled={busy}>
                  دخول
                </button>
              </form>
            ) : (
              <>
                <div className="actions">
                  <button disabled={busy} onClick={() => run(refresh)}>
                    تحديث
                  </button>
                  <button disabled={busy} onClick={logout}>
                    خروج
                  </button>
                </div>
                {role === "admin" && (
                  <button
                    disabled={busy || !!pushToken}
                    onClick={() =>
                      run(async () => {
                        const token = await enablePush();
                        setPushToken(token);
                        localStorage.setItem("naqaa-push-token", token);
                        setMessage("تم تفعيل تنبيهات الطلبات على هذا الهاتف");
                      })
                    }
                  >
                    {pushToken
                      ? "🔔 التنبيهات مفعّلة"
                      : "🔔 فعّل إشعارات الطلب الجديد"}
                  </button>
                )}
                {orders.length === 0 && <p>لا توجد طلبات معروضة.</p>}
                {orders.map((order) => (
                  <article className="order" key={order.id}>
                    <small>{order.order_number}</small>
                    <h2>{order.customer_name}</h2>
                    <span className="badge">{STATUS_LABELS[order.status]}</span>
                    <p>
                      {order.service_type} · {order.pickup_date}
                    </p>
                    <p>{order.address}</p>
                    <p>
                      {order.total_amount == null
                        ? "المبلغ لم يُحدّد"
                        : `${order.total_amount} ₪`}{" "}
                      ·{" "}
                      {order.payment_status === "paid"
                        ? "تم التحصيل"
                        : "نقدًا عند التسليم"}
                    </p>
                    <a href={`tel:${order.phone}`}>اتصال بالعميل</a>
                    <div className="actions">
                      {(role === "admin"
                        ? ORDER_STATUSES.filter((s) => s !== order.status).map(
                            (next) => ({ next, label: STATUS_LABELS[next] }),
                          )
                        : (DRIVER_STATUS_ACTIONS[order.status] ?? [])
                      ).map((action) => (
                        <button
                          disabled={busy}
                          key={action.next}
                          onClick={() =>
                            run(async () => {
                              await api(
                                "/api/mobile/orders",
                                {
                                  id: order.id,
                                  status: action.next,
                                  expected_status: order.status,
                                },
                                "PATCH",
                              );
                              await refresh();
                            })
                          }
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </>
            )}
          </>
        )}
      </main>
      <nav aria-label="التنقل الرئيسي">
        {(
          [
            ["home", "الرئيسية"],
            ["booking", "حجز"],
            ["tracking", "تتبع"],
            ["staff", "الفريق"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={screen === id ? "selected" : ""}
            onClick={() => {
              setScreen(id);
              setMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
