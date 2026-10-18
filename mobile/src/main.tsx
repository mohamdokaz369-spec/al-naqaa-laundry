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
} from "../../lib/types";
import type { Order, OrderStatus } from "../../lib/types";
import "./style.css";
import AdminPanel from "./AdminPanel";
import { currentPickupLocation } from "./location";
import { googleMapsLocation } from "../../lib/maps-location";
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
  const [locating,setLocating]=useState(false);
  const [locationNotice,setLocationNotice]=useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    service_type: "غسيل",
    pickup_date: businessClock().date,
    pickup_time: "10:00",
    notes: "",
    whatsapp_opt_in: false,
    location_lat: null as number | null,
    location_lng: null as number | null,
    google_maps_link: "",
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
      if (locating) throw new Error("استنّى تحديد الموقع أو جرّب مرة ثانية");
      const linked=googleMapsLocation(form.google_maps_link);
      const payload={...form,...linked};
      if (!payload.address.trim() && payload.location_lat === null && !payload.google_maps_link) throw new Error("حدد الموقع أو الصق رابط خرائط أو اكتب العنوان");
      const key = await orderRequestKey(payload, sessionStorage);
      const result = await api("/api/orders", payload, "POST", {
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
                العنوان أو وصف إضافي للموقع
                <input
                  value={form.address}
                  onChange={(e) => change("address", e.target.value)}
                  required={!form.google_maps_link}
                  maxLength={300}
                  autoComplete="street-address"
                />
              </label>
              <section aria-label="موقع الاستلام">
                <button type="button" disabled={busy || locating} onClick={async()=>{
                  setLocating(true);setLocationNotice("");
                  try { const location=await currentPickupLocation();setForm(f=>({...f,location_lat:location.location_lat,location_lng:location.location_lng,google_maps_link:location.google_maps_link}));setLocationNotice(`تم تحديد الموقع. الدقة التقريبية ${Math.round(location.accuracy)} متر. راجع النقطة قبل تأكيد الطلب.`); }
                  catch(error){setLocationNotice(error instanceof Error?error.message:"تعذر تحديد الموقع");}
                  finally{setLocating(false);}
                }}>{locating?"جارٍ تحديد موقعك…":"📍 استخدم موقعي الحالي"}</button>
                <p>نأخذ موقعك عند ضغط الزر فقط، ونرسله للمغسلة مع تأكيد الطلب لتسهيل الاستلام.</p>
                {locationNotice && <p role="status">{locationNotice}</p>}
                <label>أو الصق رابط المشاركة من Google Maps
                  <input type="url" maxLength={500} placeholder="https://maps.app.goo.gl/…" value={form.google_maps_link} disabled={locating || busy} onChange={e=>{setForm(f=>({...f,google_maps_link:e.target.value,location_lat:null,location_lng:null}));setLocationNotice("");}}/>
                </label>
                <p>لموقع آخر: افتح Google Maps، اضغط مطولًا على المكان، ثم مشاركة ← نسخ الرابط والصقه هنا.</p>
                <a href="https://www.google.com/maps" target="_blank" rel="noreferrer">افتح Google Maps لاختيار المكان ↗</a>
                {form.google_maps_link && <div className="actions">
                  {(()=>{try{const point=googleMapsLocation(form.google_maps_link);return <a href={point.google_maps_link} target="_blank" rel="noreferrer">راجع موقع الاستلام على Google Maps ↗</a>;}catch{return <p>رابط الخرائط غير صحيح</p>;}})()}
                  <button type="button" disabled={locating || busy} onClick={()=>{setForm(f=>({...f,google_maps_link:"",location_lat:null,location_lng:null}));setLocationNotice("");}}>مسح الموقع</button>
                </div>}
              </section>
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
              <button className="primary" disabled={busy || locating}>
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
                {role === "admin" && <AdminPanel />}
                {role === "driver" && orders.length === 0 && <p>لا توجد طلبات معروضة.</p>}
                {(role === "driver" ? orders : []).map((order) => (
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
                    {order.google_maps_link && (()=>{try{return <p><a href={googleMapsLocation(order.google_maps_link!).google_maps_link} target="_blank" rel="noreferrer">📍 افتح موقع العميل على Google Maps</a></p>;}catch{return null;}})()}
                    <div className="actions">
                      {(DRIVER_STATUS_ACTIONS[order.status] ?? []).map((action) => (
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
