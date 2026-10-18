import { nativeCors } from "@/lib/mobile-cors";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js "Proxy" (the renamed middleware convention as of Next 16 — see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 * Refreshes the Supabase Auth session on every request and gates
 * /admin/** and /driver/** behind a signed-in user with the matching
 * role in public.profiles.
 *
 * This is a UX/defense-in-depth layer (redirect before the page even
 * renders) — the real authorization boundary is the RLS policies in
 * supabase/migrations/0001_auth_roles_and_rls.sql, which apply
 * regardless of whether this runs.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) return nativeCors(request) ?? NextResponse.next();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() (not getSession()) revalidates the token against Supabase
  // on every call — required inside middleware, see @supabase/ssr docs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin") && path !== "/admin/login";
  const isDriverRoute = path.startsWith("/driver") && path !== "/driver/login";

  if (isAdminRoute || isDriverRoute) {
    const loginPath = isAdminRoute ? "/admin/login" : "/driver/login";

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      return redirect;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const requiredRole = isAdminRoute ? "admin" : "driver";
    if (profile?.role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      url.searchParams.set("error", "unauthorized");
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/driver/:path*", "/api/orders", "/api/track", "/api/notifications/:path*", "/api/mobile/:path*"],
};
