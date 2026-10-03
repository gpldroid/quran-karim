"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {isAdmin,supabase} from "../../../lib/supabase";

const tabs=[
  ["overview","نظرة عامة","▦"],
  ["quran","القرآن","◉"],
  ["site","الموقع","◆"],
  ["content","المحتوى","✎"],
  ["releases","الإصدارات","⬇"],
  ["audit","سجل النشاط","◷"]
];

const emptyQuran={default_reader_id:"",default_reader_name:"",default_surah:1,tafsir_type:"default",autoplay:false,favorite_surahs:[]};
const emptySite={site_name:"القرآن الكريم",description:"منصة القرآن الكريم والحديث الشريف",theme:"light",locale:"ar"};

export default function Dashboard(){
  const [user,setUser]=useState(null),[tab,setTab]=useState("overview"),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  const [quran,setQuran]=useState(emptyQuran),[site,setSite]=useState(emptySite),[releases,setReleases]=useState([]),[builds,setBuilds]=useState([]),[content,setContent]=useState([]),[audit,setAudit]=useState([]);
  const [contentDraft,setContentDraft]=useState({id:null,kind:"site",title:"",body:"",source:"",published:true});
  const [releaseDraft,setReleaseDraft]=useState({version_code:"",version_name:"",release_tag:"",release_url:"",download_url:"",artifact_url:"",changelog:"",status:"draft"});

  async function load(){
    setLoading(true);setError("");
    try{
      const {data,error:authError}=await supabase.auth.getUser();
      if(authError||!data.user)throw new Error("انتهت الجلسة. سجل الدخول من جديد.");
      if(!(await isAdmin(data.user.id)))throw new Error("لا توجد صلاحية مدير لهذا الحساب.");
      setUser(data.user);
      const [qs,sc,rel,bld,ct,lg]=await Promise.all([
        supabase.from("quran_settings").select("*").eq("id",1).maybeSingle(),
        supabase.from("site_config").select("key,value,updated_at").eq("key","general").maybeSingle(),
        supabase.from("app_releases").select("*").order("version_code",{ascending:false}),
        supabase.from("app_builds").select("*").order("version_code",{ascending:false}).limit(10),
        supabase.from("quran_app_content").select("*").order("updated_at",{ascending:false}),
        supabase.from("audit_logs").select("*").order("created_at",{ascending:false}).limit(30)
      ]);
      for(const x of [qs,sc,rel,bld,ct,lg])if(x.error)throw x.error;
      if(qs.data)setQuran({...emptyQuran,...qs.data});
      if(sc.data)setSite({...emptySite,...(sc.data.value||{})});
      setReleases(rel.data||[]);setBuilds(bld.data||[]);setContent(ct.data||[]);setAudit(lg.data||[]);
    }catch(e){setError(e?.message||"تعذر تحميل لوحة التحكم.");}
    finally{setLoading(false);}
  }

  useEffect(()=>{load()},[]);
  useEffect(()=>{
    if(!user)return;
    const channel=supabase.channel("quran-admin-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"quran_settings"},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"site_config"},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"app_releases"},load)
      .subscribe();
    return()=>{supabase.removeChannel(channel)};
  },[user]);

  function flash(text){setMessage(text);setTimeout(()=>setMessage(""),2500)}
  async function saveQuran(){
    setSaving(true);setError("");
    const {error}=await supabase.from("quran_settings").upsert({id:1,default_reader_id:quran.default_reader_id||null,default_reader_name:quran.default_reader_name||null,default_surah:Number(quran.default_surah)||1,tafsir_type:quran.tafsir_type||"default",autoplay:Boolean(quran.autoplay),favorite_surahs:quran.favorite_surahs||[]});
    setSaving(false);if(error)setError(error.message);else flash("تم حفظ إعدادات القرآن.");
  }
  async function saveSite(){
    setSaving(true);setError("");
    const {error}=await supabase.from("site_config").upsert({key:"general",value:site});
    setSaving(false);if(error)setError(error.message);else flash("تم حفظ إعدادات الموقع.");
  }
  async function saveContent(e){
    e.preventDefault();setSaving(true);setError("");
    const payload={kind:contentDraft.kind,title:contentDraft.title.trim(),body:contentDraft.body,source:contentDraft.source||null,published:contentDraft.published,created_by:user.id};
    const q=contentDraft.id?supabase.from("quran_app_content").update(payload).eq("id",contentDraft.id):supabase.from("quran_app_content").insert(payload);
    const {error}=await q;setSaving(false);
    if(error)setError(error.message);else{setContentDraft({id:null,kind:"site",title:"",body:"",source:"",published:true});flash("تم حفظ المحتوى.");load()}
  }
  async function deleteContent(id){
    if(!confirm("حذف هذا المحتوى؟"))return;
    const {error}=await supabase.from("quran_app_content").delete().eq("id",id);
    if(error)setError(error.message);else{flash("تم الحذف.");load()}
  }
  async function saveRelease(e){
    e.preventDefault();setSaving(true);setError("");
    const payload={...releaseDraft,version_code:Number(releaseDraft.version_code),github_run_id:null,github_release_id:null,published_at:releaseDraft.status==="published"?new Date().toISOString():null};
    const {error}=await supabase.from("app_releases").upsert(payload,{onConflict:"version_code"});
    setSaving(false);if(error)setError(error.message);else{setReleaseDraft({version_code:"",version_name:"",release_tag:"",release_url:"",download_url:"",artifact_url:"",changelog:"",status:"draft"});flash("تم حفظ الإصدار.");load()}
  }
  async function logout(){await supabase.auth.signOut();window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH||"")+"/admin/login/")}

  if(loading)return <main className="admin-shell"><div className="loading">جارٍ تحميل لوحة التحكم...</div></main>;
  if(error&&!user)return <main className="wrap"><div className="error">{error}</div><Link className="btn" href="/admin/login/">العودة للدخول</Link></main>;

  return <main className="admin-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">ق</div><div><strong>القرآن الكريم</strong><small>مركز التحكم</small></div></div>
      <nav>{tabs.map(([id,label,icon])=><button key={id} className={tab===id?"side-link active":"side-link"} onClick={()=>setTab(id)}><span>{icon}</span>{label}</button>)}<Link className="side-link" href="/admin/operations/"><span>⌘</span>مركز التشغيل والمحرر</Link></nav>
      <div className="sidebar-foot"><div className="online-dot"/> الاتصال وRealtime نشط</div>
    </aside>
    <section className="admin-main">
      <header className="admin-head">
        <div><p className="eyebrow">لوحة الإدارة</p><h1>{tabs.find(x=>x[0]===tab)?.[1]}</h1><p className="muted">{user?.email}</p></div>
        <button className="btn alt" onClick={logout}>تسجيل الخروج</button>
      </header>
      {message&&<div className="success">{message}</div>}
      {error&&<div className="error">{error}</div>}

      {tab==="overview"&&<Overview quran={quran} releases={releases} builds={builds} content={content} onTab={setTab}/>}
      {tab==="quran"&&<section className="panel">
        <div className="panel-head"><div><h2>إعدادات المصحف</h2><p className="muted">إعدادات محلية للمشروع. مصادر القرآن الخارجية تُدار لاحقاً داخل موقع القرآن المتخصص فقط.</p></div><button className="btn" onClick={saveQuran} disabled={saving}>{saving?"حفظ...":"حفظ الإعدادات"}</button></div>
