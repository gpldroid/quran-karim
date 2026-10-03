"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {islamway,supabase} from "../lib/supabase";

export default function Home(){
  const [settings,setSettings]=useState(null);
  const [readers,setReaders]=useState([]);
  const [error,setError]=useState("");

  useEffect(()=>{
    (async()=>{
      try{
        const {data,error:settingsError}=await supabase.from("quran_app_settings").select("key,value");
        if(settingsError)throw settingsError;
        setSettings(Object.fromEntries((data||[]).map(x=>[x.key,x.value])));
        const r=await islamway("readers");
        setReaders(r.readers||[]);
      }catch(e){
        setError(e?.message||"تعذر تحميل البيانات.");
      }
    })();
  },[]);

  return <main className="wrap">
    <div className="hero">
      <div className="small">بسم الله الرحمن الرحيم</div>
      <h1>القرآن الكريم</h1>
      <p>{settings?.site?.description||"منصة جديدة للقرآن الكريم والحديث الشريف"}</p>
      <div className="nav">
        <Link className="btn" href="/admin/login/">دخول لوحة التحكم</Link>
        <a className="btn alt" href="#readers">القرّاء</a>
      </div>
    </div>
    <section id="readers">
      <div className="top"><h2>قرّاء القرآن</h2><span className="muted">{readers.length+" قارئ"}</span></div>
      {error&&<div className="error">{error}</div>}
      <div className="grid">
        {readers.slice(0,24).map(r=><article className="card" key={r.id}>
          <h3>{r.name}</h3>
          <p className="muted small">بيانات من Islamway API</p>
        </article>)}
      </div>
    </section>
    <section className="grid" style={{marginTop:24}}>
      <article className="card"><h2>القرآن</h2><p>واجهة مستقلة ومصدر الصوت والقرّاء عبر طبقة Islamway.</p></article>
      <article className="card"><h2>الحديث الشريف</h2><p>مساحة مستقلة قابلة للإدارة من لوحة التحكم الجديدة.</p></article>
    </section>
  </main>;
}