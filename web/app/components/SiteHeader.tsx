"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, Home, BookOpen, Scale, ShieldCheck, Cookie, Mail, Info } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";
const services = [["quran","القرآن الكريم"],["listen","الاستماع"],["tafsir","التفسير"],["hadith","الحديث"],["azkar","الأذكار"],["prayer","الصلاة"],["qibla","القبلة"],["hijri","التقويم الهجري"],["khatma","خطة الختمة"],["names","أسماء الله الحسنى"],["library","المكتبة الإسلامية"],["assistant","مساعد البحث"]];
const legal = [["about.html","من نحن",Info],["contact.html","اتصل بنا",Mail],["privacy.html","الخصوصية",ShieldCheck],["terms.html","الشروط والأحكام",Scale],["cookies.html","ملفات تعريف الارتباط",Cookie]];

export default function SiteHeader(){
  const [open,setOpen]=useState<"services"|"legal"|null>(null);
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{const close=(e:MouseEvent)=>{if(!(e.target as HTMLElement).closest(".wow-header-menu"))setOpen(null)};document.addEventListener("click",close);return()=>document.removeEventListener("click",close)},[]);
  const go=()=>{setOpen(null);setMobile(false)};
  return <header className="wow-site-header" dir="rtl"><div className="wow-header-inner">
    <a className="wow-brand" href={BASE+"/"} onClick={go} aria-label="الصفحة الرئيسية"><img src={BASE+"/logo.svg"} alt="القرآن الكريم"/><span>القرآن الكريم</span></a>
    <button className="wow-menu-toggle" type="button" aria-label={mobile?"إغلاق القائمة":"فتح القائمة"} aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?<X size={23}/>:<Menu size={23}/>}</button>
    <nav className={"wow-header-nav "+(mobile?"is-open":"")}>
      <a className="wow-nav-link" href={BASE+"/"} onClick={go}><Home size={17}/>الرئيسية</a>
      <div className="wow-header-menu"><button className={"wow-nav-link wow-nav-trigger "+(open==="services"?"is-active":"")} type="button" aria-expanded={open==="services"} onClick={e=>{e.stopPropagation();setOpen(open==="services"?null:"services")}}><BookOpen size={17}/>الأقسام<ChevronDown size={16}/></button>
        {open==="services"&&<div className="wow-dropdown wow-services-dropdown">{services.map(([slug,label])=><a key={slug} href={BASE+"/"+slug+"/"} onClick={go}>{label}</a>)}</div>}</div>
      <div className="wow-header-menu"><button className={"wow-nav-link wow-nav-trigger "+(open==="legal"?"is-active":"")} type="button" aria-expanded={open==="legal"} onClick={e=>{e.stopPropagation();setOpen(open==="legal"?null:"legal")}}><Scale size={17}/>الروابط الأساسية<ChevronDown size={16}/></button>
        {open==="legal"&&<div className="wow-dropdown">{legal.map(([href,label,Icon])=><a key={href} href={BASE+"/"+href} onClick={go}><Icon size={16}/>{label}</a>)}</div>}</div>
    </nav><div className="wow-header-spacer"/></div></header>
}