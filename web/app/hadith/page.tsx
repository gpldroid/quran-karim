"use client";
import {useEffect,useState} from "react";
import {V2Page} from "@/src/components/V2Page";import {V2Card} from "@/src/components/V2Card";
const books=[["bukhari","صحيح البخاري"],["muslim","صحيح مسلم"],["abudawud","سنن أبي داود"],["tirmidzi","جامع الترمذي"],["nasai","سنن النسائي"],["ibnumajah","سنن ابن ماجه"],["ahmad","مسند أحمد"],["malik","موطأ مالك"]];
type Hadith={number:number;arab?:string;id?:string;numberInBook?:number};
export default function Hadith(){
 const [book,setBook]=useState("bukhari"),[start,setStart]=useState(1),[items,setItems]=useState<Hadith[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(""),[loaded,setLoaded]=useState(false);
 const load=async()=>{setLoading(true);setError("");try{const end=Math.min(start+9,start+299);const r=await fetch("https://api.hadith.gading.dev/books/"+book+"?range="+start+"-"+end);if(!r.ok)throw new Error();const x=await r.json();const rows=x.data?.hadiths||[];if(!rows.length)throw new Error();setItems(rows);setLoaded(true)}catch{setItems([]);setError("لم نتمكن من تحميل هذه المجموعة. جرّب كتاباً آخر أو أعد المحاولة.")}finally{setLoading(false)}};
 useEffect(()=>{void load()},[book,start]);
 return <V2Page title="الحديث النبوي" subtitle="تصفح مجموعات من كتب الحديث مع إظهار اسم الكتاب ورقم الحديث. راجع الطبعة المعتمدة عند البحث العلمي أو الاستدلال.">
 <V2Card title="اختيار الكتاب"><div className="v2-form"><select value={book} onChange={e=>{setBook(e.target.value);setStart(1)}}>{books.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select><label>بداية الأرقام <input type="number" min="1" value={start} onChange={e=>setStart(Math.max(1,Math.min(99999,+e.target.value||1)))}/></label><button onClick={load} disabled={loading}>{loading?"جارٍ التحميل…":"تحديث"}</button></div><small>يعرض 10 أحاديث في كل دفعة. مصدر البيانات: Hadith API (يتضمن ترجمات إندونيسية في بعض الكتب).</small>{error&&<p role="alert">{error}</p>}</V2Card>
 <V2Card title="نتائج التصفح">{loaded&&!error&&items.map((h,i)=><article className="v2-list-item" key={h.number||i}><small>رقم الحديث: {h.number||start+i}</small><p className="v2-arabic">{h.arab||"النص العربي غير متاح في سجل المصدر هذا."}</p>{h.id&&<p>{h.id}</p>}</article>)}{!items.length&&!loading&&!error&&<p>اختر مجموعة لعرض الأحاديث.</p>}<div className="v2-form"><button disabled={start===1||loading} onClick={()=>setStart(Math.max(1,start-10))}>السابق</button><button disabled={loading} onClick={()=>setStart(start+10)}>التالي</button></div></V2Card>
 </V2Page>
}