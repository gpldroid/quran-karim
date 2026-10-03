"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {isAdmin,supabase,islamway} from "../../../lib/supabase";

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
  const [quran,setQuran]=useState(emptyQuran),[site,setSite]=useState(emptySite),[releases,setReleases]=useState([]),[builds,setBuilds]=useState([]),[content,setContent]=useState([]),[audit,setAudit]=useState([]),[readers,setReaders]=useState([]),[surahs,setSurahs]=useState([]);
  const [readerSearch,setReaderSearch]=useState(""),[surahSearch,setSurahSearch]=useState(""),[contentDraft,setContentDraft]=useState({id:null,kind:"site",title:"",body:"",source:"",published:true});
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
      const [rr,ss]=await Promise.all([islamway("readers"),islamway("surahs")]);
      setReaders(rr.readers||[]);setSurahs(ss.surahs||[]);
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

  const filteredReaders=useMemo(()=>readers.filter(x=>String(x.name).toLowerCase().includes(readerSearch.toLowerCase())),[readers,readerSearch]);
  const filteredSurahs=useMemo(()=>surahs.filter(x=>String(x.name).includes(surahSearch)||String(x.number).includes(surahSearch)),[surahs,surahSearch]);

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

      {tab==="overview"&&<Overview quran={quran} releases={releases} builds={builds} content={content} readers={readers} onTab={setTab}/>}
      {tab==="quran"&&<section className="panel">
        <div className="panel-head"><div><h2>إعدادات المصحف</h2><p className="muted">Islamway API + المشغل + السورة والقارئ الافتراضي.</p></div><button className="btn" onClick={saveQuran} disabled={saving}>{saving?"حفظ...":"حفظ الإعدادات"}</button></div>
        <div className="form-grid">
          <Field label="البحث عن قارئ"><input value={readerSearch} onChange={e=>setReaderSearch(e.target.value)} placeholder="اكتب اسم القارئ"/></Field>
          <Field label="القارئ الافتراضي"><select value={quran.default_reader_id} onChange={e=>{const r=readers.find(x=>x.id===e.target.value);setQuran({...quran,default_reader_id:e.target.value,default_reader_name:r?.name||""})}}><option value="">اختر قارئاً</option>{filteredReaders.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
          <Field label="البحث عن سورة"><input value={surahSearch} onChange={e=>setSurahSearch(e.target.value)} placeholder="رقم أو اسم السورة"/></Field>
          <Field label="السورة الافتراضية"><select value={quran.default_surah} onChange={e=>setQuran({...quran,default_surah:Number(e.target.value)})}>{filteredSurahs.map(s=><option key={s.id} value={s.number}>{s.number} — {s.name}</option>)}</select></Field>
          <Field label="نوع التفسير"><select value={quran.tafsir_type} onChange={e=>setQuran({...quran,tafsir_type:e.target.value})}><option value="default">الافتراضي</option><option value="muyassar">التفسير الميسر</option><option value="jalalayn">الجلالين</option></select></Field>
          <label className="check"><input type="checkbox" checked={quran.autoplay} onChange={e=>setQuran({...quran,autoplay:e.target.checked})}/><span>تشغيل الصوت تلقائياً</span></label>
        </div>
        <div className="subpanel"><h3>القراء المتاحون</h3><div className="chips">{filteredReaders.slice(0,24).map(r=><button className="chip" key={r.id} onClick={()=>setQuran({...quran,default_reader_id:r.id,default_reader_name:r.name})}>{r.name}</button>)}</div></div>
      </section>}

      {tab==="site"&&<section className="panel"><div className="panel-head"><div><h2>إعدادات الموقع</h2><p className="muted">الهوية واللغة والمظهر والوصف.</p></div><button className="btn" onClick={saveSite} disabled={saving}>حفظ</button></div><div className="form-grid">
        <Field label="اسم الموقع"><input value={site.site_name} onChange={e=>setSite({...site,site_name:e.target.value})}/></Field>
        <Field label="اللغة"><select value={site.locale} onChange={e=>setSite({...site,locale:e.target.value})}><option value="ar">العربية</option><option value="en">English</option></select></Field>
        <Field label="المظهر"><select value={site.theme} onChange={e=>setSite({...site,theme:e.target.value})}><option value="light">فاتح</option><option value="dark">داكن</option><option value="auto">تلقائي</option></select></Field>
        <Field label="الوصف"><textarea rows="4" value={site.description} onChange={e=>setSite({...site,description:e.target.value})}/></Field>
      </div></section>}

      {tab==="content"&&<section className="panel"><div className="panel-head"><div><h2>إدارة المحتوى</h2><p className="muted">مقالات ومحتوى القرآن والحديث وصفحات الموقع.</p></div></div>
        <form className="editor" onSubmit={saveContent}><div className="form-grid"><Field label="النوع"><select value={contentDraft.kind} onChange={e=>setContentDraft({...contentDraft,kind:e.target.value})}><option value="site">الموقع</option><option value="quran">القرآن</option><option value="hadith">الحديث</option></select></Field><Field label="العنوان"><input required value={contentDraft.title} onChange={e=>setContentDraft({...contentDraft,title:e.target.value})}/></Field><Field label="المصدر"><input value={contentDraft.source} onChange={e=>setContentDraft({...contentDraft,source:e.target.value})}/></Field><Field label="النشر"><select value={String(contentDraft.published)} onChange={e=>setContentDraft({...contentDraft,published:e.target.value==="true"})}><option value="true">منشور</option><option value="false">مسودة</option></select></Field></div><Field label="النص"><textarea rows="7" value={contentDraft.body} onChange={e=>setContentDraft({...contentDraft,body:e.target.value})}/></Field><div className="actions"><button className="btn" disabled={saving}>{contentDraft.id?"تحديث المحتوى":"إضافة المحتوى"}</button>{contentDraft.id&&<button type="button" className="btn alt" onClick={()=>setContentDraft({id:null,kind:"site",title:"",body:"",source:"",published:true})}>إلغاء</button>}</div></form>
        <div className="table-wrap"><table><thead><tr><th>العنوان</th><th>النوع</th><th>الحالة</th><th>المصدر</th><th>إجراء</th></tr></thead><tbody>{content.map(x=><tr key={x.id}><td>{x.title}</td><td>{x.kind}</td><td>{x.published?"منشور":"مسودة"}</td><td>{x.source||"—"}</td><td><button className="link-btn" onClick={()=>setContentDraft(x)}>تعديل</button> <button className="danger-btn" onClick={()=>deleteContent(x.id)}>حذف</button></td></tr>)}</tbody></table></div>
      </section>}

      {tab==="releases"&&<section className="panel"><div className="panel-head"><div><h2>إصدارات Android</h2><p className="muted">version code/name، GitHub Release، Artifact وChangelog.</p></div></div>
        <form className="editor" onSubmit={saveRelease}><div className="form-grid"><Field label="Version Code"><input required type="number" value={releaseDraft.version_code} onChange={e=>setReleaseDraft({...releaseDraft,version_code:e.target.value})}/></Field><Field label="Version Name"><input required value={releaseDraft.version_name} onChange={e=>setReleaseDraft({...releaseDraft,version_name:e.target.value})}/></Field><Field label="Release Tag"><input value={releaseDraft.release_tag} onChange={e=>setReleaseDraft({...releaseDraft,release_tag:e.target.value})}/></Field><Field label="الحالة"><select value={releaseDraft.status} onChange={e=>setReleaseDraft({...releaseDraft,status:e.target.value})}><option value="draft">مسودة</option><option value="building">قيد البناء</option><option value="published">منشور</option><option value="failed">فشل</option></select></Field><Field label="رابط GitHub Release"><input type="url" value={releaseDraft.release_url} onChange={e=>setReleaseDraft({...releaseDraft,release_url:e.target.value})}/></Field><Field label="رابط APK"><input type="url" value={releaseDraft.download_url} onChange={e=>setReleaseDraft({...releaseDraft,download_url:e.target.value})}/></Field><Field label="رابط Artifact"><input type="url" value={releaseDraft.artifact_url} onChange={e=>setReleaseDraft({...releaseDraft,artifact_url:e.target.value})}/></Field></div><Field label="Changelog"><textarea rows="5" value={releaseDraft.changelog} onChange={e=>setReleaseDraft({...releaseDraft,changelog:e.target.value})}/></Field><button className="btn" disabled={saving}>حفظ الإصدار</button></form>
        <div className="table-wrap"><table><thead><tr><th>الإصدار</th><th>الحالة</th><th>Release</th><th>APK</th><th>التاريخ</th></tr></thead><tbody>{releases.map(x=><tr key={x.id}><td><strong>{x.version_name}</strong><div className="muted small">#{x.version_code}</div></td><td><span className={"status "+x.status}>{x.status}</span></td><td>{x.release_url?<a className="link-btn" href={x.release_url} target="_blank" rel="noreferrer">فتح</a>:"—"}</td><td>{x.download_url?<a className="link-btn" href={x.download_url} target="_blank" rel="noreferrer">تحميل</a>:"—"}</td><td>{new Date(x.created_at).toLocaleDateString("ar-MA")}</td></tr>)}</tbody></table></div>
      </section>}

      {tab==="audit"&&<section className="panel"><div className="panel-head"><div><h2>سجل النشاط</h2><p className="muted">تغييرات الإعدادات والإصدارات المسجلة آلياً.</p></div></div><div className="table-wrap"><table><thead><tr><th>الوقت</th><th>الجدول</th><th>العملية</th><th>المعرف</th></tr></thead><tbody>{audit.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleString("ar-MA")}</td><td>{x.table_name}</td><td>{x.operation}</td><td className="small">{x.record_id||"—"}</td></tr>)}</tbody></table></div></section>}
    </section>
  </main>;
}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Overview({quran,releases,builds,content,readers,onTab}){
  const cards=[["القراء",readers.length,"مصدر Islamway"],["المحتوى",content.length,"سجل المحتوى"],["الإصدارات",releases.length,"أحدث 5 محفوظة"],["Builds",builds.length,"آخر عمليات البناء"]];
  return <><div className="stats">{cards.map(([a,b,c])=><button className="stat" key={a} onClick={()=>onTab(a==="القراء"?"quran":a==="الإصدارات"?"releases":"content")}><span>{a}</span><strong>{b}</strong><small>{c}</small></button>)}</div><div className="grid-two"><section className="panel"><div className="panel-head"><div><h2>حالة القرآن</h2><p className="muted">الإعدادات الحالية من Supabase.</p></div><button className="link-btn" onClick={()=>onTab("quran")}>إدارة</button></div><div className="kv"><span>القارئ</span><b>{quran.default_reader_name||"غير محدد"}</b><span>السورة</span><b>{quran.default_surah||1}</b><span>التشغيل التلقائي</span><b>{quran.autoplay?"مفعّل":"متوقف"}</b></div></section><section className="panel"><div className="panel-head"><div><h2>آخر إصدار</h2><p className="muted">متابعة APK وGitHub.</p></div><button className="link-btn" onClick={()=>onTab("releases")}>الإصدارات</button></div>{releases[0]?<div className="release-card"><strong>{releases[0].version_name}</strong><span className={"status "+releases[0].status}>{releases[0].status}</span><p>{releases[0].changelog||"لا يوجد changelog."}</p></div>:<p className="muted">لا توجد إصدارات.</p>}</section></div></>
}