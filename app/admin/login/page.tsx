"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Never statically prerender the login screen — keeps it consistent with
// the rest of /admin/** and avoids a build-time crash if
// NEXT_PUBLIC_SUPABASE_* env vars aren't set.
export const dynamic = "force-dynamic";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("error") === "unauthorized";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setError("");
    if (!email.trim() || !password) {
      setError("أدخل البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("هذا الحساب لا يملك صلاحية الإدارة");
      return;
    }

    router.push("/admin/orders");
    router.refresh();
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-sm rounded-2xl bg-white/10 p-6">
        <h1 className="mb-1 text-2xl font-bold">لوحة الإدارة</h1>
        <p className="mb-6 text-sm text-slate-400">مغسلة النقاء</p>

        {unauthorized && (
          <p className="mb-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
            هذا الحساب لا يملك صلاحية الدخول لهذه الصفحة
          </p>
        )}

        <input
          type="email"
          aria-label="البريد الإلكتروني" placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") login(); }}
          className="mb-2 w-full rounded-lg bg-slate-800 p-3 text-white outline-none"
          autoComplete="username"
        />
        <input
          type="password"
          aria-label="كلمة المرور" placeholder="كلمة المرور"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") login(); }}
          className={`mb-2 w-full rounded-lg bg-slate-800 p-3 text-white outline-none ${error ? "ring-1 ring-red-500" : ""}`}
          autoComplete="current-password"
        />

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={login}
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-cyan-600 p-3 font-bold hover:bg-cyan-500 disabled:opacity-50"
        >
          {loading ? "جاري التحقق..." : "دخول"}
        </button>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
