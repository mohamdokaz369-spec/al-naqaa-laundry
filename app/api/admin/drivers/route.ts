import { staffIdentity } from "@/lib/staff-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: Request) {
  let stage = "admin-check";
  let isAdmin = false;
  try {
    // Cookie requests must originate from this site; bearer clients authenticate separately.
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) return Response.json({ error: "طلب غير مسموح" }, { status: 403 });
    const identity = await staffIdentity(req);
    if (identity?.role !== "admin") return Response.json({ error: "غير مصرح" }, { status: 403 });
    isAdmin = true;
    stage = "request";
    const body = await req.json();
    const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!phone || !name || name.length > 100 || typeof body.password !== "string" || body.password.length < 8 || body.password.length > 128 || (body.id != null && (!Number.isSafeInteger(body.id) || body.id < 1))) {
      return Response.json({ error: "أدخل الاسم ورقم هاتف صحيح وكلمة مرور من 8 إلى 128 حرفاً" }, { status: 400 });
    }
    stage = "driver-lookup";
    const db = createServiceRoleClient();
    // Existing drivers retain their phone and identity; this operation sets credentials only.
    let driverId: number | null = body.id ?? null;
    if (driverId) {
      const { data: driver, error } = await db.from("drivers").select("phone").eq("id", driverId).single();
      if (error || !driver) return Response.json({ error: "السائق غير موجود" }, { status: 404 });
      if (normalizePhone(driver.phone ?? "") !== phone) return Response.json({ error: "استخدم رقم السائق المسجل عند تعيين كلمة المرور" }, { status: 400 });
    } else {
      const { data: drivers, error } = await db.from("drivers").select("id,phone");
      if (error) throw error;
      if (drivers?.some(d => normalizePhone(d.phone ?? "") === phone)) return Response.json({ error: "السائق موجود، استخدم تعيين كلمة مرور" }, { status: 409 });
    }
    stage = "profile-lookup";
    const { data: profiles, error: profileError } = driverId
      ? await db.from("profiles").select("id,role").eq("driver_id", driverId)
      : { data: [], error: null };
    if (profileError) throw profileError;
    if (profiles && (profiles.length > 1 || profiles.some(p => p.role !== "driver"))) return Response.json({ error: "تعذر ربط الحساب، راجع الإدارة" }, { status: 409 });
    stage = "auth-account";
    const email = `driver.${phone}@drivers.alnaqaa.org`;
    if (profiles?.length === 1) {
      const { error } = await db.auth.admin.updateUserById(profiles[0].id, { email, email_confirm: true, password: body.password });
      if (error) return Response.json({ error: "تعذر تحديث الحساب؛ تأكد أن الرقم غير مرتبط بحساب آخر" }, { status: 409 });
      return Response.json({ ok: true });
    }
    const { data: account, error: authError } = await db.auth.admin.createUser({ email, email_confirm: true, password: body.password });
    if (authError || !account.user) return Response.json({ error: "تعذر إنشاء الحساب؛ قد يكون الرقم مستخدماً أو كلمة المرور غير مقبولة" }, { status: 409 });
    const userId = account.user.id;
    let createdDriver = false;
    try {
      if (!driverId) {
        stage = "driver-insert";
        const { data, error } = await db.from("drivers").insert({ name, phone }).select("id").single();
        if (error || !data) throw error || new Error("Driver creation failed");
        driverId = data.id;
        createdDriver = true;
      }
      stage = "profile-insert";
      const { error } = await db.from("profiles").insert({ id: userId, role: "driver", driver_id: driverId });
      if (error) throw error;
    } catch (error) {
      await db.auth.admin.deleteUser(userId);
      if (createdDriver) await db.from("drivers").delete().eq("id", driverId);
      throw error;
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    const safeCode = typeof code === "string" && /^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(code) ? code : null;
    console.error("Driver account save failed", { stage, code: safeCode });
    return Response.json({ error: "تعذر حفظ حساب السائق، حاول مجدداً", ...(isAdmin ? { stage, code: safeCode } : {}) }, { status: 500 });
  }
}
