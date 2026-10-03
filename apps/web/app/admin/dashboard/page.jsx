"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import LivePreview from "../../../components/LivePreview";
import QuranPlayer from "../../../components/QuranPlayer";
import ApkReleaseManager from "../../../components/ApkReleaseManager";
import QuranSettingsEditor from "../../../components/QuranSettingsEditor";
import { supabase } from "../../../lib/supabaseClient";

const base = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.GITHUB_ACTIONS === "true" ? "/quran-karim" : "");

export default function Dashboard() {
  const [state, setState] = useState("checking");
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(null);
  const [release, setRelease] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.assign(base + "/admin/login/");
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        await supabase.auth.signOut();
        window.location.assign(base + "/admin/login/");
        return;
      }

      const { data: isAdmin, error } = await supabase.rpc("is_admin");
      if (error) {
        setMessage("RPC is_admin فشل: " + error.message);
        setState("denied");
        return;
      }

      if (isAdmin !== true) {
        setMessage("الحساب مصادق عليه لكنه غير مسجل كمسؤول في user_roles/admin_users.");
        setState("denied");
        return;
      }

      const [{ data: s }, { data: r }] = await Promise.all([
        supabase.from("quran_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("app_releases").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      setSettings(s);
      setRelease(r);
      setState("ready");
    })().catch((error) => {
      setMessage(error?.message || "تعذر تحميل لوحة التحكم.");
      setState("denied");
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.assign(base + "/admin/login/");
  }

  if (state === "checking") {
    return (
      <main dir="rtl" className="min-h-screen bg-zinc-950 p-8 text-white">
        <div className="mx-auto mt-20 max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <ShieldCheck className="text-emerald-400" />
          <h1 className="mt-4 text-2xl font-bold">جارٍ التحقق من الجلسة والصلاحية…</h1>
        </div>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main dir="rtl" className="min-h-screen bg-zinc-950 p-8 text-white">
        <div className="mx-auto mt-20 max-w-lg rounded-2xl border border-red-900 bg-zinc-900 p-8">
          <h1 className="text-2xl font-bold">لا تملك صلاحية الإدارة</h1>
          <p className="mt-3 text-red-300">{message}</p>
          <button onClick={logout} className="mt-6 rounded-xl border border-zinc-700 px-4 py-2">تسجيل الخروج</button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-zinc-950 p-5 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-emerald-400">Quran Karim</p>
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          </div>
          <button onClick={logout} className="flex gap-2 rounded-xl border border-zinc-700 px-4 py-2">
            <LogOut /> خروج
          </button>
        </header>

        <div className="mt-6 space-y-5">
          <QuranSettingsEditor settings={settings} onSaved={setSettings} />
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <h2 className="text-xl font-bold">معاينة القرآن والتلاوة</h2>
                <div className="mt-4"><QuranPlayer /></div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <ApkReleaseManager onRelease={setRelease} />
              </div>
            </section>
            <LivePreview settings={settings} release={release} />
          </div>
        </div>
      </div>
    </main>
  );
}
