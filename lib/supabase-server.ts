import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client that reads the signed-in user's session from
 * cookies. Use this in Server Components / Route Handlers that act on
 * behalf of the logged-in admin/driver — it is subject to RLS exactly like
 * the browser client, so it can never see more than that user is allowed
 * to see.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render with no response to
            // write cookies to — safe to ignore, proxy.ts already
            // refreshes the session on every request.
          }
        },
      },
    }
  );
}

/**
 * Service-role client: bypasses Row Level Security entirely.
 *
 * NEVER import this file from a "use client" component, and never let
 * SUPABASE_SERVICE_ROLE_KEY reach the browser (no NEXT_PUBLIC_ prefix,
 * ever). Use it only inside app/api/** route handlers, and only after the
 * route has done its own authorization/validation — this client will
 * happily read or write anything regardless of RLS policies.
 */
export function createServiceRoleClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY غير معرّف في متغيرات البيئة — مطلوب لعمليات الخادم في app/api/**. " +
        "راجع .env.example."
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
