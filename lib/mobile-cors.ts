import { NextRequest, NextResponse } from "next/server";
const NATIVE_ORIGINS = new Set([
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
]);
export function nativeCors(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || !NATIVE_ORIGINS.has(origin)) return null;
  const response =
    req.method === "OPTIONS"
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,Idempotency-Key",
  );
  response.headers.set("Vary", "Origin");
  return response;
}
