"use client";

import { useEffect, useState } from "react";
import { AlertCircle, KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: isAdmin, error } = await supabase.rpc("is_admin");
      if (!error && isAdmin === true) {
        window.location.assign(base + "/admin/dashboard/");
        return;
      }

      await supabase.auth.signOut();
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "reset") {
      const redirectTo = window.location.origin + base + "/admin/reset-password/";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      setLoading(false);
      setMessage(
        error
          ? "تعذر إرسال رابط استعادة كلمة المرور: " + error.message
          : "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. افتح الرابط ثم عيّن كلمة مرور جديدة."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage("فشل تسجيل الدخول: " + error.message);
      setLoading(false);
      return;
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");

    if (rpcError) {
      await supabase.auth.signOut();
      setMessage("تعذر التحقق من صلاحية الإدارة: " + rpcError.message);
      setLoading(false);
      return;
    }

    if (isAdmin !== true) {
      await supabase.auth.signOut();
      setMessage(
        "تم تسجيل الدخول بنجاح، لكن هذا الحساب ليس مسؤولاً بعد. يجب إضافته إلى user_roles بدور Super Admin أو إلى admin_users."
      );
      setLoading(false);
      return;
    }

    window.location.assign(base + "/admin/dashboard/");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-zinc-950 p-6 text-white">
      <form
        onSubmit={submit}
        className="mx-auto mt-16 max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <ShieldCheck className="text-emerald-400" size={32} />

        <h1 className="mt-4 text-2xl font-bold">تسجيل دخول الإدارة</h1>

        <p className="mt-2 text-sm text-zinc-400">
          تسجيل الدخول يتم عبر Supabase ثم يتم التحقق من صلاحية الإدارة عبر RPC ‏is_admin().
        </p>

        <label className="mt-6 block text-sm text-zinc-300">البريد الإلكتروني</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          autoComplete="email"
          className="mt-2 w-full rounded-xl bg-zinc-800 p-3 outline-none ring-emerald-500 focus:ring-2"
        />

        {mode === "login" && (
          <>
            <label className="mt-3 block text-sm text-zinc-300">كلمة المرور</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl bg-zinc-800 p-3 outline-none ring-emerald-500 focus:ring-2"
            />
          </>
        )}

        <button
          disabled={loading}
          className="mt-5 flex w-full justify-center gap-2 rounded-xl bg-emerald-500 p-3 font-bold text-black disabled:opacity-50"
        >
          {mode === "login" ? <LogIn size={18} /> : <KeyRound size={18} />}
          {loading
            ? "جارٍ المعالجة…"
            : mode === "login"
              ? "دخول"
              : "إرسال رابط الاستعادة"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "reset" : "login");
            setMessage("");
          }}
          className="mt-4 w-full text-sm text-emerald-400 hover:underline"
        >
          {mode === "login" ? "نسيت كلمة المرور؟" : "العودة إلى تسجيل الدخول"}
        </button>

        {message && (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </form>
    </main>
  );
}
