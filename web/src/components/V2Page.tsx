import type { ReactNode } from "react";
const BASE=process.env.NEXT_PUBLIC_BASE_PATH||"/wow";
export const nav=[["quran","القرآن"],["listen","الاستماع"],["tafsir","التفسير"],["hadith","الحديث"],["azkar","الأذكار"],["prayer","الصلاة"],["qibla","القبلة"],["hijri","الهجري"],["khatma","الختمة"],["names","أسماء الله"],["library","المكتبة"],["assistant","المساعد"]];
export function V2Page({title,subtitle,children}:{title:string;subtitle:string;children:ReactNode}){
return <main className="v2-page" dir="rtl"><header className="v2-inner v2-header"><a className="v2-logo" href={BASE+"/"}>WOW<span>.</span></a><nav>{nav.map(([p,n])=><a key={p} href={BASE+"/"+p+"/"}>{n}</a>)}</nav><a className="v2-login" href={BASE+"/login/"}>دخول</a></header><section className="v2-inner v2-title"><a href={BASE+"/"}>← الرئيسية</a><p>WOW V2 · FAITH · KNOWLEDGE · DAILY LIFE</p><h1>{title}</h1><div>{subtitle}</div></section><section className="v2-inner v2-content">{children}</section><footer className="v2-footer"><a href={BASE+"/"}>WOW<span>.</span></a><span>منصة معرفة وعبادة متعددة اللغات</span></footer></main>}
export const api={quran:"https://api.alquran.cloud/v1", adhan:"https://api.aladhan.com/v1"};
