import "server-only";
import webpush from "web-push";
export function webPushReady() {
  return !!(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY);
}
export async function sendWebPush(subscription: webpush.PushSubscription, orderNumber: string, eventId: string, test = false) {
  if (!webPushReady()) throw new Error("Web push not configured");
  webpush.setVapidDetails("mailto:alnaqaa61@gmail.com", process.env.WEB_PUSH_PUBLIC_KEY!, process.env.WEB_PUSH_PRIVATE_KEY!);
  return webpush.sendNotification(subscription, JSON.stringify({title:test ? "تجربة إشعارات النقاء" : "طلب جديد وصل 🧺",body:test ? "الإشعارات مفعّلة على هذا الجهاز. هذه رسالة تجربة فقط." : `وصل الطلب ${orderNumber}. افتح لوحة الإدارة لمراجعته.`,tag:eventId,url:"/admin/orders"}), {TTL:3600,timeout:10000});
}
