import "server-only";
import { createHash } from "node:crypto";
import { createServiceRoleClient } from "./supabase-server";
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const bucket = createHash("sha256").update(key).digest("hex");
  const { data, error } = await createServiceRoleClient().rpc("consume_request_limit", { bucket_key: bucket, max_hits: limit, window_seconds: Math.ceil(windowMs / 1000) });
  if (error) throw new Error("Rate limit storage unavailable");
  return data === true;
}
// Vercel overwrites this header at its trusted ingress; see https://vercel.com/docs/headers/request-headers
export function clientIp(req: Request): string {
  const forwarded = process.env.VERCEL ? req.headers.get("x-vercel-forwarded-for") : req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}
