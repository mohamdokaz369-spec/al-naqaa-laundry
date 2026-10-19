import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createServiceRoleClient } from "../supabase-server";
import { normalizePhone } from "../phone";
import { customerStatusLabel, pushMessage, whatsappTemplate } from "./messages";
import { sendWebPush, webPushReady } from "./web-push";
class DeliveryError extends Error {
  constructor(
    public category: "configuration" | "temporary" | "permanent" | "uncertain",
  ) {
    super(category);
  }
}
export async function dispatchNotifications() {
  const db = createServiceRoleClient();
  const { data: jobs, error } = await db.rpc("claim_notifications", {
    batch_size: 5,
  });
  if (error) throw new Error("Notification queue unavailable");
  for (const job of jobs ?? []) {
    try {
      const { data: order } = await db
        .from("orders")
        .select("order_number,phone,whatsapp_opt_in")
        .eq("id", job.order_id)
        .single();
      if (!order) throw new DeliveryError("permanent");
      let providerIds: string[] = [];
      if (job.channel === "push_admin") {
        const config = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!config && !webPushReady()) throw new DeliveryError("configuration");
        let firebase;
        try {
          if (config) firebase =
            getApps().find((app) => app.name === "naqaa-notifications") ??
            initializeApp(
              { credential: cert(JSON.parse(config)) },
              "naqaa-notifications",
            );
        } catch {
          throw new DeliveryError("configuration");
        }
        const { data: admins, error: adminsError } = await db
          .from("profiles")
          .select("id")
          .eq("role", "admin");
        if (adminsError) throw new DeliveryError("temporary");
        const { data: devices, error: devicesError } = await db
          .from("push_devices")
          .select("id,token,platform")
          .in(
            "user_id",
            (admins ?? []).map((a) => a.id),
          );
        if (devicesError) throw new DeliveryError("temporary");
        if (!devices?.length) throw new DeliveryError("configuration");
        const { data: receipts, error: receiptsError } = await db
          .from("notification_push_receipts")
          .select("device_id")
          .eq("job_id", job.id);
        if (receiptsError) throw new DeliveryError("temporary");
        const delivered = new Set((receipts ?? []).map((r) => r.device_id));
        for (const device of devices.filter((d) => !delivered.has(d.id))) {
          try {
            if (device.platform === "web") {
              if (!webPushReady()) throw new DeliveryError("configuration");
              await sendWebPush(JSON.parse(device.token), order.order_number, job.id);
            } else {
              if (!firebase) throw new DeliveryError("configuration");
              const id = await getMessaging(firebase).send({
              ...pushMessage(order.order_number, job.id),
              token: device.token,
            });
              providerIds.push(id);
            }
            const { error: saved } = await db
              .from("notification_push_receipts")
              .insert({ job_id: job.id, device_id: device.id });
            if (saved) throw new DeliveryError("uncertain");
          } catch (error) {
            const code = (error as { code?: string }).code;
            const statusCode = (error as { statusCode?: number }).statusCode;
            if (
              statusCode === 404 || statusCode === 410 ||
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            )
              await db.from("push_devices").delete().eq("id", device.id);
            else
              throw error instanceof DeliveryError
                ? error
                : new DeliveryError("temporary");
          }
        }
      } else {
        const customer = job.channel === "whatsapp_customer";
        if (customer && !order.whatsapp_opt_in) {
          await db
            .from("notification_outbox")
            .update({
              status: "sent",
              last_error: "consent_revoked",
              sent_at: new Date().toISOString(),
            })
            .eq("id", job.id)
            .eq("lock_token", job.lock_token);
          continue;
        }
        const to = normalizePhone(
          customer ? order.phone : (process.env.WHATSAPP_ADMIN_PHONE ?? ""),
        );
        const template = customer
          ? process.env.WHATSAPP_CUSTOMER_TEMPLATE
          : process.env.WHATSAPP_ADMIN_TEMPLATE;
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const version = process.env.WHATSAPP_GRAPH_VERSION;
        if (
          !to ||
          !template ||
          !token ||
          !phoneId ||
          !version ||
          !/^v\d+\.\d+$/.test(version)
        )
          throw new DeliveryError("configuration");
        const payload = whatsappTemplate(
          to,
          template,
          process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "ar",
          customer
            ? [order.order_number, customerStatusLabel(job.order_status)]
            : [order.order_number],
        );
        let response: Response;
        try {
          response = await fetch(
            `https://graph.facebook.com/${version}/${encodeURIComponent(phoneId)}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(10000),
            },
          );
        } catch {
          throw new DeliveryError("uncertain");
        }
        if (!response.ok)
          throw new DeliveryError(
            response.status === 429 || response.status >= 500
              ? "temporary"
              : "permanent",
          );
        const result = await response.json();
        const id = result.messages?.[0]?.id;
        if (typeof id !== "string") throw new DeliveryError("uncertain");
        providerIds = [id];
      }
      const { error: ackError } = await db
        .from("notification_outbox")
        .update({
          status: "sent",
          provider_ids: providerIds,
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", job.id)
        .eq("lock_token", job.lock_token);
      if (ackError) throw new DeliveryError("uncertain");
    } catch (error) {
      const category =
        error instanceof DeliveryError ? error.category : "temporary";
      const blocked = category === "configuration";
      const exhausted =
        job.attempts >= 5 ||
        category === "permanent" ||
        category === "uncertain";
      await db
        .from("notification_outbox")
        .update({
          status: blocked ? "blocked" : exhausted ? "failed" : "pending",
          attempts: blocked ? job.attempts - 1 : job.attempts,
          last_error: category,
          available_at: new Date(
            Date.now() +
              (blocked ? 900000 : Math.min(3600000, 30000 * 2 ** job.attempts)),
          ).toISOString(),
        })
        .eq("id", job.id)
        .eq("lock_token", job.lock_token);
    }
  }
  return { processed: jobs?.length ?? 0 };
}
