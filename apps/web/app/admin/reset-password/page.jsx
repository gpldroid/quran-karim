"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً من صفحة تسجيل الدخول.");
        setLoading(false);
        return;
      }

      setReady(true);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.");
      return;
    }

    if (password !== confirm) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage("تعذر تغيير كلمة المرور: " + error.message);
      return;
    }

    setDone(true);
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="mx-auto mt-20 max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <ShieldCheck className="text-emerald-400" size={32} />
          <h1 className="mt-4 text-2xl font-bold">جارٍ التحقق من رابط الاستعادة…</h1>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-zinc-950 p-6 text-white">
      <form
        onSubmit={submit}
        className="mx-auto mt-16 max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <KeyRound className="text-emerald-400" size={32} />
        <h1 className="mt-4 text-2xl font-bold">تعيين كلمة مرور جديدة</h1>

        {done ? (
          <>
            <div className="mt-5 flex gap-2 rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول إلى لوحة التحكم.</span>
            </div>
            <a
              href={base + "/admin/login/"}
              className="mt-5 block rounded-xl bg-emerald-500 p-3 text-center font-bold text-black"
            >
              العودة إلى تسجيل الدخول
            </a>
          </>
        ) : !ready ? (
          <div className="mt-5 flex gap-2 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <>
            <label className="mt-6 block text-sm text-zinc-300">كلمة المرور الجديدة</label>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl bg-zinc-800 p-3 outline-none ring-emerald-500 focus:ring-2"
            />

            <label className="mt-3 block text-sm text-zinc-300">تأكيد كلمة المرور</label>
            <input
              required
              minLength={8}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl bg-zinc-800 p-3 outline-none ring-emerald-500 focus:ring-2"
            />

            <button
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-emerald-500 p-3 font-bold text-black disabled:opacity-50"
            >
              {loading ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
            </button>
          </>
        )}

        {message && ready && (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </form>
    </main>
  );
}
