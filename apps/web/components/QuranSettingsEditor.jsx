"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { islamwayApi } from "../lib/islamwayApi";

export default function QuranSettingsEditor({ settings, onSaved }) {
  const [surah, setSurah] = useState(String(settings?.default_surah || 1));
  const [readerId, setReaderId] = useState(settings?.default_reader_id || "");
  const [readerName, setReaderName] = useState(settings?.default_reader_name || "");
  const [autoplay, setAutoplay] = useState(Boolean(settings?.autoplay));
  const [readers, setReaders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSurah(String(settings?.default_surah || 1));
    setReaderId(settings?.default_reader_id || "");
    setReaderName(settings?.default_reader_name || "");
    setAutoplay(Boolean(settings?.autoplay));
  }, [settings]);

  useEffect(() => {
    islamwayApi.readers().then(setReaders).catch(() => setReaders([]));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase
      .from("quran_settings")
      .upsert({
        id: 1,
        default_surah: Math.min(114, Math.max(1, Number(surah) || 1)),
        default_reader_id: readerId || null,
        default_reader_name: readerName || null,
        autoplay,
      })
      .select("*")
      .single();
    if (error) setMessage("تعذر الحفظ: " + error.message);
    else {
      setMessage("تم حفظ الإعدادات وسيتم بث التغيير مباشرة.");
      onSaved?.(data);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} dir="rtl" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-xl font-bold">إعدادات المصحف</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-2 block text-zinc-400">السورة الافتراضية (1–114)</span>
          <input type="number" min="1" max="114" value={surah} onChange={(e) => setSurah(e.target.value)} className="w-full rounded-xl bg-zinc-800 p-3" />
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-zinc-400">القارئ</span>
          <select value={readerId} onChange={(e) => {
            const item = readers.find((x) => String(x.id) === e.target.value);
            setReaderId(e.target.value);
            setReaderName(item?.name || "");
          }} className="w-full rounded-xl bg-zinc-800 p-3">
            <option value="">بدون تحديد</option>
            {readers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label className="flex items-end gap-2 rounded-xl bg-zinc-900 p-3 text-sm">
          <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
          <span>تشغيل تلقائي</span>
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-black disabled:opacity-50">
          <Save size={17} /> {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
        </button>
        {message && <span className="text-sm text-zinc-400">{message}</span>}
      </div>
    </form>
  );
}
