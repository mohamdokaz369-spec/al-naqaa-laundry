"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Same reasoning as app/admin/login/page.tsx.
export const dynamic = "force-dynamic";

function DriverLoginForm() {
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
      .select("role, driver_id")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "driver" || !profile.driver_id) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("هذا الحساب غير مسجّل كسائق. تواصل مع الإدارة.");
      return;
    }

    router.push("/driver");
    router.refresh();
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-sm rounded-2xl bg-white/10 p-6">
        <div className="mb-4 text-center text-5xl">🚗</div>
        <h1 className="mb-1 text-center text-2xl font-bold">دخول السائق</h1>
        <p className="mb-6 text-center text-sm text-slate-400">مغسلة النقاء</p>

        {unauthorized && (
          <p className="mb-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
            هذا الحساب لا يملك صلاحية الدخول لهذه الصفحة
          </p>
        )}

        <input
          type="email"
          className="mb-3 w-full rounded-xl border border-white/20 bg-transparent p-4 text-lg text-white placeholder-slate-500 outline-none"
          aria-label="البريد الإلكتروني" placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && login()}
          autoComplete="username"
        />
        <input
          type="password"
          className="mb-3 w-full rounded-xl border border-white/20 bg-transparent p-4 text-lg text-white placeholder-slate-500 outline-none"
          aria-label="كلمة المرور" placeholder="كلمة المرور"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && login()}
          autoComplete="current-password"
        />

        {error && (
          <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded-xl bg-cyan-600 p-4 text-lg font-bold hover:bg-cyan-500 disabled:opacity-50"
        >
          {loading ? "جاري التحقق..." : "دخول"}
        </button>
      </div>
    </div>
  );
}

export default function DriverLoginPage() {
  return (
    <Suspense>
      <DriverLoginForm />
    </Suspense>
  );
}
