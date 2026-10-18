import { STATUS_LABELS } from "../types";
import type { OrderStatus } from "../types";
export function whatsappTemplate(
  to: string,
  template: string,
  language: string,
  parameters: string[],
) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: parameters.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };
}
export function customerStatusLabel(status: string) {
  if (status === "on_the_way") return "السائق في الطريق لاستلام أغراضك. يرجى تجهيزها للاستلام.";
  if (status === "delivering") return "السائق في الطريق لتسليم أغراضك بعد الغسيل. يرجى الاستعداد للاستلام.";
  return STATUS_LABELS[status as OrderStatus] ?? "تم تحديث الطلب";
}
export function pushMessage(orderNumber: string, eventId: string) {
  return {
    notification: {
      title: "طلب جديد وصل 🧺",
      body: `وصل الطلب ${orderNumber}. افتح التطبيق لمراجعته.`,
    },
    data: { eventId, orderNumber, screen: "orders" },
    android: {
      priority: "high" as const,
      notification: { channelId: "new-orders", sound: "default", tag: eventId },
    },
    apns: {
      payload: { aps: { sound: "default" } },
      headers: { "apns-collapse-id": eventId },
    },
  };
}
