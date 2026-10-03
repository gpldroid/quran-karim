"use client";
import {useEffect,useMemo,useState} from "react";
import {BookOpen,Headphones,Loader2,Search} from "lucide-react";
import {quranApi} from "../lib/quranApi";
import {islamwayApi} from "../lib/islamwayApi";

export default function QuranExplorer({compact=false}){
 const [surahs,setSurahs]=useState([]),[selected,setSelected]=useState(1),[chapter,setChapter]=useState(null),[readers,setReaders]=useState([]),[reader,setReader]=useState(null),[audioSurahs,setAudioSurahs]=useState([]),[query,setQuery]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{try{const [s,r]=await Promise.all([quranApi.surahs(),islamwayApi.readers()]);if(active){setSurahs(s||[]);setReaders(r||[]);setReader(r?.[0]||null)}}catch(e){if(active)setError(e.message||"تعذر تحميل البيانات");}finally{if(active)setLoading(false)}})();return()=>{active=false}},[]);
 useEffect(()=>{if(!reader)return;let active=true;islamwayApi.surahs(reader.id).then(v=>{if(active)setAudioSurahs(v||[])}).catch(()=>{});return()=>{active=false}},[reader]);
 useEffect(()=>{let active=true;quranApi.surah(selected).then(v=>{if(active)setChapter(v)}).catch(e=>{if(active)setError(e.message||"تعذر تحميل السورة")});return()=>{active=false}},[selected]);
 const filtered=useMemo(()=>surahs.filter(s=>String(s.number).includes(query)||s.name?.includes(query)||s.englishName?.toLowerCase().includes(query.toLowerCase())),[surahs,query]);
 const audio=audioSurahs.find(s=>Number(s.number)===Number(selected));
 if(loading)return <div className="flex min-h-56 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900"><Loader2 className="animate-spin text-emerald-400"/></div>;
 return <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
  <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
   <div className="mb-4 flex items-center gap-2"><BookOpen className="text-emerald-400" size={20}/><b>السور</b></div>
   <div className="mb-3 flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن سورة" className="w-full bg-transparent outline-none"/></div>
   <div className={compact?"max-h-72":"max-h-[560px]"} style={{overflowY:"auto"}}>{filtered.map(s=><button key={s.number} onClick={()=>setSelected(s.number)} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-right ${selected===s.number?"bg-emerald-500 text-black":"hover:bg-zinc-800"}`}><span>{s.number}. {s.name?.replace(/^سُورَةُ\s*/,"")}</span><small>{s.numberOfAyahs} آية</small></button>)}</div>
  </aside>
  <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:p-8">
   {error&&<div className="mb-4 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
   {chapter&&<><header className="border-b border-zinc-800 pb-5 text-center"><p className="text-sm text-emerald-400">{chapter.revelationType==="Meccan"?"مكية":"مدنية"} • {chapter.numberOfAyahs} آية</p><h2 className="mt-2 text-3xl font-bold">{chapter.name}</h2><p className="mt-1 text-sm text-zinc-500">{chapter.englishName}</p></header>
   <div className="my-6 flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-950 p-4"><Headphones className="text-emerald-400"/><select value={reader?.id||""} onChange={e=>setReader(readers.find(r=>String(r.id)===e.target.value)||null)} className="min-w-48 rounded-xl bg-zinc-800 p-2"><option value="">اختر القارئ</option>{readers.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>{audio?.audioUrl?<audio controls src={audio.audioUrl} className="min-w-[240px] flex-1"/>:<span className="text-sm text-zinc-500">اختر قارئاً متاحاً لهذه السورة.</span>}</div>
   <div className="space-y-5 leading-[2.7]">{chapter.ayahs?.map(a=><article key={a.number} className="rounded-2xl border border-zinc-800/70 bg-zinc-950/50 p-5"><p className="text-right font-serif text-2xl md:text-3xl">{a.text} <span className="mr-2 inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-emerald-700 px-2 align-middle text-sm text-emerald-400">{a.numberInSurah}</span></p></article>)}</div></>}
  </section>
 </div>;
}
