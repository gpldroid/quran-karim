"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../lib/supabase";

export default function Home(){
  const [settings,setSettings]=useState(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    (async()=>{
      try{
        const {data,error:settingsError}=await supabase.from("quran_app_settings").select("key,value");
        if(settingsError)throw settingsError;
        setSettings(Object.fromEntries((data||[]).map(x=>[x.key,x.value])));
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
      </div>
    </div>
    <section className="grid">
      <article className="card"><h2>موقع القرآن الكريم</h2><p>واجهة القرآن الكريم قيد الإنشاء. سيتم ربط مصادر القراءة والاستماع وواجهة Islamway API لاحقاً عند اكتمال موقع القرآن المتخصص.</p></article>
      <article className="card"><h2>الحديث الشريف</h2><p>مساحة مستقلة قابلة للإدارة من لوحة التحكم الجديدة.</p></article>
    </section>
/main>;
}