"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

type Item={type:string;title:string;excerpt:string|null;body:string|null;image_url:string|null};
const BASE=process.env.NEXT_PUBLIC_BASE_PATH || "/wow";

export default function ContentPage(){
  const [item,setItem]=useState<Item|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const slug=new URLSearchParams(window.location.search).get("slug");
    if(!supabase || !slug){setLoading(false);return;}
    supabase.from("content_items").select("type,title,excerpt,body,image_url").eq("slug",slug).eq("published",true).maybeSingle()
      .then(({data})=>{setItem(data);setLoading(false);});
  },[]);
  if(loading) return <main className="shell" dir="rtl"><article className="content-page"><p>جاري التحميل…</p></article></main>;
  if(!item) return <main className="shell" dir="rtl"><article className="content-page"><a className="back" href={BASE+"/"}>← العودة للرئيسية</a><h1>المحتوى غير موجود</h1></article></main>;
  return <main className="shell" dir="rtl"><article className="content-page"><a className="back" href={BASE+"/"}>← العودة للرئيسية</a><span className="badge">{item.type}</span><h1>{item.title}</h1>{item.image_url&&<img src={item.image_url} alt={item.title}/>} {item.excerpt&&<p className="lead">{item.excerpt}</p>}<div className="body">{item.body?.split(/
+/).map((p:string,i:number)=><p key={i}>{p}</p>)}</div></article></main>;
}
