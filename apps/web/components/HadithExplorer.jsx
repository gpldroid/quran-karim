"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2, RefreshCw } from "lucide-react";
import { hadithApi } from "../lib/hadithApi";

const BOOKS = [
  ["bukhari", "صحيح البخاري"],
  ["muslim", "صحيح مسلم"],
  ["abu-dawud", "سنن أبي داود"],
  ["tirmidzi", "جامع الترمذي"],
  ["nasai", "سنن النسائي"],
  ["ibnu-majah", "سنن ابن ماجه"],
];

function normalize(data) {
  const item = data?.data ?? data;
  if (Array.isArray(item)) return item;
  if (Array.isArray(item?.hadiths)) return item.hadiths;
  if (item?.contents) return [item.contents];
  return item ? [item] : [];
}

export default function HadithExplorer() {
  const [book, setBook] = useState("bukhari");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await hadithApi.range(book, 1, 10);
      setItems(normalize(data));
    } catch (e) {
      setError(e.message || "تعذر تحميل الأحاديث");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [book]);

  return (
    <div dir="rtl" className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="text-emerald-400" />
          <div>
            <h2 className="text-2xl font-black">الأحاديث النبوية</h2>
            <p className="text-sm text-zinc-500">عرض الأحاديث العربية من كتب الحديث المتاحة.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={book} onChange={(e) => setBook(e.target.value)} className="rounded-xl bg-zinc-800 p-2">
            {BOOKS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <button onClick={load} disabled={loading} className="rounded-xl border border-zinc-700 p-2" aria-label="تحديث">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-950/30 p-3 text-red-300">{error}</p>}
      {loading && <div className="flex min-h-40 items-center justify-center"><Loader2 className="animate-spin text-emerald-400" /></div>}
      {!loading && !error && (
        <div className="mt-6 space-y-4">
          {items.map((item, index) => {
            const hadith = item?.hadith ?? item?.contents ?? item;
            const arabic = hadith?.arab ?? hadith?.arabic ?? hadith?.text ?? "لا يوجد نص عربي";
            const number = hadith?.number ?? item?.number ?? index + 1;
            return (
              <article key={`${number}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="mb-3 text-sm text-emerald-400">حديث رقم {number}</div>
                <p className="font-serif text-xl leading-[2.2]">{arabic}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
