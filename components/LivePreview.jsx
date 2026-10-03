"use client";
import {useEffect,useState} from "react";
import {subscribeToTable,supabase} from "../lib/supabaseClient";
export default function LivePreview({settings,release}){
 const [live,setLive]=useState(settings||{}),[status,setStatus]=useState("connecting");
 useEffect(()=>{setLive(settings||{});if(!supabase){setStatus("offline");return}const c=subscribeToTable("quran_settings",p=>{if(p.eventType!=="DELETE")setLive(p.new||{})});setStatus("subscribed");return()=>c.unsubscribe()},[settings]);
 return <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="mb-4 flex justify-between"><h2 className="font-bold">Live Preview</h2><span className="text-xs text-emerald-400">{status}</span></div><div className="rounded-xl bg-zinc-950 p-5"><p className="text-xs text-zinc-500">القارئ الافتراضي</p><p className="mt-1 text-lg">{live.reader_name||"غير محدد"}</p><p className="mt-4 text-xs text-zinc-500">السورة الافتراضية</p><p className="mt-1 text-lg">{live.default_surah||"غير محددة"}</p>{release?.download_url&&<a className="mt-6 block rounded-lg bg-emerald-500 px-4 py-2 text-center font-bold text-black" href={release.download_url}>تنزيل آخر APK</a>}</div></aside>;
}