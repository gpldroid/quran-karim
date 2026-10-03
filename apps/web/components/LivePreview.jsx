"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function LivePreview({ settings, release }) {
  const [liveSettings, setLiveSettings] = useState(settings);
  const [liveRelease, setLiveRelease] = useState(release);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiveSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLiveRelease(release);
  }, [release]);

  useEffect(() => {
    const settingsChannel = supabase
      .channel("dashboard-live-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "quran_settings" }, ({ new: row }) => {
        if (row) setLiveSettings(row);
      })
      .subscribe();

    const releaseChannel = supabase
      .channel("dashboard-live-releases")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_releases" }, async () => {
        setLoading(true);
        const { data } = await supabase
          .from("app_releases")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setLiveRelease(data || null);
        setLoading(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(releaseChannel);
    };
  }, []);

  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-emerald-400">المعاينة المباشرة</p>
          <h2 className="mt-1 text-xl font-bold">حالة الموقع والتطبيق</h2>
        </div>
        <RefreshCw className={loading ? "animate-spin text-emerald-400" : "text-zinc-500"} size={20} />
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-sm text-zinc-500">السورة الافتراضية</p>
          <p className="mt-1 font-semibold">السورة رقم {liveSettings?.default_surah || 1}</p>
          {liveSettings?.default_reader_name && (
            <p className="mt-1 text-sm text-zinc-400">القارئ: {liveSettings.default_reader_name}</p>
          )}
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-sm text-zinc-500">آخر إصدار منشور</p>
          {liveRelease ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">v{liveRelease.version_name}</p>
                <p className="text-xs text-zinc-500">Build {liveRelease.version_code}</p>
              </div>
              {liveRelease.download_url && (
                <a href={liveRelease.download_url} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-500 p-2 text-black">
                  <Download size={18} />
                </a>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">لا يوجد إصدار منشور.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
