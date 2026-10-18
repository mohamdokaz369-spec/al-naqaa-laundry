import "server-only";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "./supabase-server";
export async function staffIdentity(req: Request) {
  const bearer = req.headers.get("authorization");
  const client = bearer
    ? createServiceRoleClient()
    : await createServerSupabaseClient();
  const {
    data: { user },
  } = bearer
    ? await client.auth.getUser(bearer.replace(/^Bearer /i, ""))
    : await client.auth.getUser();
  if (!user) return null;
  const { data: profile } = await createServiceRoleClient()
    .from("profiles")
    .select("role,driver_id")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "driver"].includes(profile.role)) return null;
  if (profile.role === "driver") {
    const { data: driver } = await createServiceRoleClient()
      .from("drivers")
      .select("is_active")
      .eq("id", profile.driver_id)
      .single();
    if (!driver?.is_active) return null;
  }
  return {
    id: user.id,
    role: profile.role as "admin" | "driver",
    driverId: profile.driver_id as number | null,
  };
}
