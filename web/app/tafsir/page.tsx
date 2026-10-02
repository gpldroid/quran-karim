"use client";
import {useEffect,useState} from "react";
import {V2Page,api} from "@/src/components/V2Page";
import {V2Card} from "@/src/components/V2Card";
type Surah={number:number;name:string;numberOfAyahs:number;englishName:string};
type Ayah={numberInSurah:number;text:string};
export default function Tafsir(){
 const [surahs,setSurahs]=useState<Surah[]>([]),[surah,setSurah]=useState(1),[ayah,setAyah]=useState(1),[data,setData]=useState<any>(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{fetch(api.quran+"/surah").then(r=>r.json()).then(x=>{if(x.code===200)setSurahs(x.data||[])}).catch(()=>setError("تعذر تحميل فهرس السور."))},[]);
 const selected=surahs.find(s=>s.number===surah);
 const go=async()=>{if(!selected||ayah<1||ayah>selected.numberOfAyahs){setError("رقم الآية خارج نطاق السورة المحددة.");return}setLoading(true);setError("");try{const r=await fetch(api.quran+"/ayah/"+surah+":"+ayah+"/ar.muyassar");const x=await r.json();if(!r.ok||x.code!==200)throw new Error();setData(x.data)}catch{setError("تعذر جلب التفسير حالياً. تحقق من الاتصال ثم أعد المحاولة.")}finally{setLoading(false)}};
 return <V2Page title="التفسير" subtitle="اختر السورة والآية لعرض نصها والتفسير الميسر. النص والتفسير يُجلبان من واجهة القرآن المفتوحة.">
 <V2Card title="تحديد موضع الآية"><div className="v2-form"><select aria-label="السورة" value={surah} onChange={e=>{setSurah(+e.target.value);setAyah(1);setData(null)}}>{surahs.map(s=><option key={s.number} value={s.number}>{s.number}. {s.name} — {s.englishName}</option>)}</select><input aria-label="رقم الآية" type="number" min="1" max={selected?.numberOfAyahs||286} value={ayah} onChange={e=>setAyah(+e.target.value)}/><button onClick={go} disabled={loading}>{loading?"جارٍ التحميل…":"عرض التفسير"}</button></div>{selected&&<small>عدد آيات السورة: {selected.numberOfAyahs}</small>}{error&&<p role="alert">{error}</p>}</V2Card>
 {data&&<V2Card title={data.surah?.name+" · الآية "+data.numberInSurah}><p className="v2-arabic">{data.text}</p><hr/><b>التفسير الميسر</b><p className="v2-library">{data.text}</p><small>المصدر: AlQuran Cloud · ar.muyassar</small></V2Card>}
 </V2Page>
}