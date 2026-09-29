"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";

type Item = { id:string; type:string; title:string; slug:string; excerpt:string|null; image_url:string|null };
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";

export default function Home() {
  const [content,setContent]=useState<Item[]>([]);
  useEffect(()=>{ if(!supabase) return; supabase.from("content_items").select("id,type,title,slug,excerpt,image_url").eq("published",true).order("created_at",{ascending:false}).then(({data})=>setContent(data ?? [])); },[]);
  return <main className="shell" dir="rtl"><section className="hero"><span className="badge">WOW Platform</span><h1>منصة واحدة للويب ولوحة التحكم والتطبيق</h1><p>محتوى واحد يمكن إدارته من Supabase وعرضه على الموقع والتطبيق.</p><div className="grid"><a href={BASE+"/dashboard/"}>لوحة التحكم</a><a href="#content">المحتوى</a></div></section><section id="content" className="card"><h2>آخر المحتوى</h2>{content.length?<div>{content.map(item=><article key={item.id}><h3><a href={BASE+"/content/?slug="+encodeURIComponent(item.slug)}>{item.title}</a></h3>{item.excerpt&&<p>{item.excerpt}</p>}</article>)}</div>:<p>لم تتم إضافة محتوى منشور بعد.</p>}</section></main>;
}
