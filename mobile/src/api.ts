import { Capacitor } from "@capacitor/core";
import { createClient } from "@supabase/supabase-js";
const base =
  import.meta.env.VITE_API_URL ?? "https://al-naqaa-laundry.vercel.app";
if (!base.startsWith("https://") && !import.meta.env.DEV)
  throw new Error("HTTPS API URL required");
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const auth = url && key ? createClient(url, key) : null;
export async function api(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
  extra: Record<string, string> = {},
) {
  const session = auth ? (await auth.auth.getSession()).data.session : null;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...extra,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? "تعذر الاتصال بالمغسلة");
  return result;
}
export async function enablePush() {
  if (!Capacitor.isNativePlatform())
    throw new Error(
      "إشعارات الهاتف تعمل من التطبيق المثبّت على Android أو iPhone",
    );
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const permission = await FirebaseMessaging.requestPermissions();
  if (permission.receive !== "granted")
    throw new Error("الإشعارات غير مسموحة. فعّلها من إعدادات الهاتف.");
  if (Capacitor.getPlatform() === "android")
    await FirebaseMessaging.createChannel({
      id: "new-orders",
      name: "طلبات النقاء الجديدة",
      importance: 5,
      sound: "default",
    });
  const { token } = await FirebaseMessaging.getToken();
  await api("/api/notifications/devices", {
    token,
    platform: Capacitor.getPlatform(),
  });
  return token;
}
export async function disablePush(token: string) {
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  try {
    await api("/api/notifications/devices", { token }, "DELETE");
  } finally {
    await FirebaseMessaging.deleteToken();
  }
}

export async function listenForPush() {
  if (!Capacitor.isNativePlatform()) return () => {};
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const handles = await Promise.all([
    FirebaseMessaging.addListener("tokenReceived", ({ token }) => {
      if (localStorage.getItem("naqaa-push-token")) {
        localStorage.setItem("naqaa-push-token", token);
        void api("/api/notifications/devices", {
          token,
          platform: Capacitor.getPlatform(),
        }).catch(() => {});
      }
    }),
    FirebaseMessaging.addListener("notificationReceived", () =>
      window.dispatchEvent(new Event("naqaa-open-orders")),
    ),
    FirebaseMessaging.addListener("notificationActionPerformed", () =>
      window.dispatchEvent(new Event("naqaa-open-orders")),
    ),
  ]);
  return () => {
    handles.forEach((handle) => void handle.remove());
  };
}
