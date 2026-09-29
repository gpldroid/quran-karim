import { notFound } from "next/navigation";
import { getSupabaseServer } from "../../../lib/supabase/server";

export default async function ContentPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const supabase=getSupabaseServer();
  if(!supabase) notFound();
  const {data:item}=await supabase.from("content_items").select("id,type,title,slug,excerpt,body,image_url,published,created_at").eq("slug",slug).eq("published",true).maybeSingle();
  if(!item) notFound();
  return <main className="shell" dir="rtl"><article className="content-page"><a className="back" href="/">← العودة للرئيسية</a><span className="badge">{item.type}</span><h1>{item.title}</h1>{item.image_url&&<img src={item.image_url} alt={item.title}/>} {item.excerpt&&<p className="lead">{item.excerpt}</p>}<div className="body">{item.body?.split(/\n+/).map((p:string,i:number)=><p key={i}>{p}</p>)}</div></article></main>;
}
