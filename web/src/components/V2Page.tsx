import type { ReactNode } from "react";
const BASE=process.env.NEXT_PUBLIC_BASE_PATH||"/wow";
export const nav=[["quran","القرآن"],["listen","الاستماع"],["tafsir","التفسير"],["hadith","الحديث"],["azkar","الأذكار"],["prayer","الصلاة"],["qibla","القبلة"],["hijri","الهجري"],["khatma","الختمة"],["names","أسماء الله"],["library","المكتبة"],["assistant","المساعد"]];
export function V2Page({title,subtitle,children}:{title:string;subtitle:string;children:ReactNode}){return <main className="v2-page" dir="rtl"><section className="v2-inner v2-title"><a className="v2-breadcrumb" href={BASE+"/"}>← الرئيسية</a><p>القرآن · المعرفة · الحياة اليومية</p><h1>{title}</h1><div>{subtitle}</div></section><section className="v2-inner v2-content">{children}</section></main>}
export const api={quran:"https://api.alquran.cloud/v1",adhan:"https://api.aladhan.com/v1"};
