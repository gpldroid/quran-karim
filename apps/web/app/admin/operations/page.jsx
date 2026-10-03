"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {supabase,islamway} from "../../../lib/supabase";
import RepositoryEditor from "./RepositoryEditor";

const roleNames=["Super Admin","Content Manager","Release Manager"];
const books=[
  ["bukhari","صحيح البخاري"],["muslim","صحيح مسلم"],["abu-dawud","سنن أبي داود"],
  ["tirmidzi","جامع الترمذي"],["nasai","سنن النسائي"],["ibnu-majah","سنن ابن ماجه"]
];

export default function Operations(){
  const [tab,setTab]=useState("sites"),[user,setUser]=useState(null),[role,setCurrentRole]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [sites,setSites]=useState([]),[site,setSite]=useState(null),[siteDraft,setSiteDraft]=useState({name:"",repo_full_name:"",default_branch:"main",base_path:"/",deployment_url:"",supabase_project_ref:"",enabled:true});
  const [gh,setGh]=useState({summary:null,releases:[],runs:[],artifacts:[],workflows:[],loading:false}),[selectedRun,setSelectedRun]=useState(null);
  const [hadith,setHadith]=useState([]),[hadithDraft,setHadithDraft]=useState({id:null,collection:"bukhari",book_number:"",hadith_number:"",title:"",body:"",source:"",grade:"",published:true}),[hadithSearch,setHadithSearch]=useState("");
  const [users,setUsers]=useState([]),[cache,setCache]=useState([]),[settings,setSettings]=useState([]),[preview,setPreview]=useState("");
  const [quranReaders,setQuranReaders]=useState([]),[quranSurahs,setQuranSurahs]=useState([]);

  const tabs=[["sites","المواقع"],["editor","محرر الملفات"],["github","GitHub"],["actions","Actions"],["hadith","الحديث"],["users","المستخدمون والأدوار"],["cache","Islamway والكاش"],["preview","Live Preview"],["android","Android والإعدادات"]];

  function flash(x){setMessage(x);setTimeout(()=>setMessage(""),2800)}
  function fail(x){setError(x?.message||String(x));setTimeout(()=>setError(""),5000)}

  async function boot(){
    setLoading(true);
    try{
      const {data,error:e}=await supabase.auth.getUser(); if(e||!data.user)throw new Error("انتهت الجلسة.");
      const {data:r}=await supabase.from("user_roles").select("role").eq("user_id",data.user.id).maybeSingle();
      const {data:a}=await supabase.from("quran_app_admins").select("user_id").eq("user_id",data.user.id).maybeSingle();
      if(!a&&!r?.role)throw new Error("لا توجد صلاحية للوحة التشغيل.");
      setUser(data.user);setCurrentRole(a?"Super Admin":r.role);
      const {data:s,error:se}=await supabase.from("managed_sites").select("*").order("created_at",{ascending:true});
      if(se)throw se; setSites(s||[]);
      if((s||[]).length)setSite(s[0]);
      await Promise.all([loadHadith(),loadUsers(),loadCache(),loadSettings(),loadIslamway()]);
    }catch(e){fail(e)}
    finally{setLoading(false)}
  }

  useEffect(()=>{boot()},[]);

  async function loadIslamway(){
    try{
      const [r,s]=await Promise.all([islamway("readers"),islamway("surahs")]);
      setQuranReaders(r.readers||[]);setQuranSurahs(s.surahs||[]);
    }catch(e){/* public API may be temporarily unavailable */}
  }

  async function loadHadith(){
    const {data,error}=await supabase.from("hadith_entries").select("*").order("updated_at",{ascending:false}).limit(100);
    if(error)fail(error); else setHadith(data||[]);
  }
  async function loadUsers(){
    const {data,error}=await supabase.functions.invoke("admin-users",{body:{action:"list"}});
    if(error)fail(error); else setUsers(data?.users||[]);
  }
  async function loadCache(){
    const {data,error}=await supabase.from("islamway_cache").select("cache_key,expires_at,updated_at").order("updated_at",{ascending:false}).limit(100);
    if(error)fail(error); else setCache(data||[]);
  }
  async function loadSettings(){
    const {data,error}=await supabase.from("quran_app_settings").select("*").order("key");
    if(error)fail(error); else setSettings(data||[]);
  }

  async function saveSite(e){
    e.preventDefault();
    if(role!=="Super Admin")return fail("إدارة المواقع متاحة لـ Super Admin فقط.");
    const payload={...siteDraft,name:siteDraft.name.trim(),repo_full_name:siteDraft.repo_full_name.trim(),base_path:siteDraft.base_path||"/",deployment_url:siteDraft.deployment_url||null,supabase_project_ref:siteDraft.supabase_project_ref||null};
    const q=siteDraft.id?supabase.from("managed_sites").update(payload).eq("id",siteDraft.id):supabase.from("managed_sites").insert(payload);
    const {error}=await q;if(error)return fail(error);
    flash("تم حفظ الموقع.");setSiteDraft({name:"",repo_full_name:"",default_branch:"main",base_path:"/",deployment_url:"",supabase_project_ref:"",enabled:true});boot();
  }
  async function deleteSite(id){
    if(role!=="Super Admin"||!confirm("حذف الموقع من مركز التحكم؟"))return;
    const {error}=await supabase.from("managed_sites").delete().eq("id",id);if(error)fail(error);else{flash("تم الحذف.");boot()}
  }
  function chooseSite(s){setSite(s);setPreview(s.deployment_url||"");setTab("github");loadGithub(s)}

  async function loadGithub(s=site){
    if(!s)return;
    setGh(x=>({...x,loading:true}));
    try{
      const calls=["summary","releases","runs","artifacts","workflows"];
      const out={};
      for(const action of calls){
        const {data,error}=await supabase.functions.invoke("github-ops",{body:{action,repo:s.repo_full_name}});
        if(error)throw error; if(data?.error)throw new Error(data.error+(data.details?.message?": "+data.details.message:""));
        out[action]=data.data;
      }
      setGh({summary:out.summary,releases:out.releases?.map(x=>x)||[],runs:out.runs?.workflow_runs||[],artifacts:out.artifacts?.artifacts||[],workflows:out.workflows?.workflows||[],loading:false});
    }catch(e){setGh(x=>({...x,loading:false}));fail(e)}
  }

  async function dispatch(workflow){
    if(role==="Content Manager")return fail("ليس لديك صلاحية تشغيل Actions.");
    const {data,error}=await supabase.functions.invoke("github-ops",{body:{action:"dispatch",repo:site.repo_full_name,workflow,ref:site.default_branch||"main"}});
    if(error)fail(error);else if(data?.error)fail(data.error);else{flash("تم إرسال طلب تشغيل Workflow.");loadGithub()}
  }

  async function syncReleases(){
    if(role==="Content Manager")return fail("ليس لديك صلاحية إدارة الإصدارات.");
    const rows=gh.releases||[];
    for(const r of rows){
      const versionName=String(r.name||r.tag_name||"").trim();
      const m=versionName.match(/(\d+(?:\.\d+)+)/);
      const versionCode=Number((m?.[1]||"0").replace(/\D/g,""))||Math.floor(new Date(r.published_at||r.created_at).getTime()/1000);
      const apk=(r.assets||[]).find(a=>String(a.name||"").toLowerCase().endsWith(".apk"));
      await supabase.from("app_releases").upsert({version_code:versionCode,version_name:versionName||r.tag_name,release_tag:r.tag_name,release_url:r.html_url,download_url:apk?.browser_download_url||null,changelog:r.body||null,status:r.draft?"draft":"published",github_release_id:r.id,published_at:r.published_at||null},{onConflict:"version_code"});
    }
    flash("تمت مزامنة GitHub Releases."); 
  }

  async function saveHadith(e){
    e.preventDefault();
    const payload={collection:hadithDraft.collection,book_number:hadithDraft.book_number||null,hadith_number:hadithDraft.hadith_number||null,title:hadithDraft.title.trim(),body:hadithDraft.body,source:hadithDraft.source||null,grade:hadithDraft.grade||null,published:hadithDraft.published,created_by:user.id};
    const q=hadithDraft.id?supabase.from("hadith_entries").update(payload).eq("id",hadithDraft.id):supabase.from("hadith_entries").insert(payload);
    const {error}=await q;if(error)fail(error);else{flash("تم حفظ الحديث.");setHadithDraft({id:null,collection:"bukhari",book_number:"",hadith_number:"",title:"",body:"",source:"",grade:"",published:true});loadHadith()}
  }
  async function deleteHadith(id){if(!confirm("حذف الحديث؟"))return;const {error}=await supabase.from("hadith_entries").delete().eq("id",id);if(error)fail(error);else loadHadith()}
  async function fetchHadithApi(){
    try{
      const {data,error}=await supabase.functions.invoke("hadith",{body:{action:"range",book:hadithDraft.collection,from:1,to:10}});
      if(error)throw error;
      const list=data?.items||data?.data||[];
      if(Array.isArray(list)&&list.length){
        const x=list[0];setHadithDraft(d=>({...d,title:x.arab?.text||x.text||"حديث من API",body:x.arab?.text||x.text||"",source:"Hadith API",hadith_number:String(x.number||"")}));
        flash("تم جلب عينة من API.");
      }else flash("استجاب API دون عناصر قابلة للتحرير.");
    }catch(e){fail(e)}
  }

  async function setRole(userId,newRole){
    const {data,error}=await supabase.functions.invoke("admin-users",{body:{action:"set_role",user_id:userId,role:newRole}});
    if(error)fail(error);else if(data?.error)fail(data.error);else{flash("تم تحديث الدور.");loadUsers()}
  }
  async function removeRole(userId){if(!confirm("إزالة الدور الإداري؟"))return;const {data,error}=await supabase.functions.invoke("admin-users",{body:{action:"remove_role",user_id:userId}});if(error)fail(error);else if(data?.error)fail(data.error);else loadUsers()}

  async function clearCache(){
    if(role==="Release Manager")return fail("هذه العملية متاحة لإدارة المحتوى.");
    if(!confirm("حذف كل كاش Islamway؟"))return;
    const {error}=await supabase.from("islamway_cache").delete().neq("cache_key","__never__");
    if(error)fail(error);else{flash("تم مسح الكاش.");loadCache()}
  }
  async function saveSetting(key,value){
    let parsed=value; try{parsed=typeof value==="string"?JSON.parse(value):value}catch{parsed=value}
    const {error}=await supabase.from("quran_app_settings").upsert({key,value:parsed,updated_by:user.id},{onConflict:"key"});
    if(error)fail(error);else{flash("تم حفظ الإعداد.");loadSettings()}
  }

  const filteredHadith=useMemo(()=>hadith.filter(x=>(x.title+" "+x.body+" "+x.collection).toLowerCase().includes(hadithSearch.toLowerCase())),[hadith,hadithSearch]);

  if(loading)return <main className="admin-shell"><div className="loading">جارٍ تحميل مركز التشغيل...</div></main>;

  return <main className="admin-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">ق</div><div><strong>مركز التشغيل</strong><small>{role}</small></div></div>
      <nav>{tabs.map(([id,label])=><button key={id} className={"side-link "+(tab===id?"active":"")} onClick={()=>setTab(id)}>{label}</button>)}</nav>
      <div className="sidebar-foot"><Link href="/admin/dashboard/">← لوحة التحكم الأساسية</Link></div>
    </aside>
    <section className="admin-main">
      <header className="admin-head"><div><p className="eyebrow">Operations Center</p><h1>{tabs.find(x=>x[0]===tab)?.[1]}</h1><p className="muted">{user?.email}</p></div><Link className="btn alt" href="/admin/dashboard/">لوحة التحكم</Link></header>
      {message&&<div className="success">{message}</div>}{error&&<div className="error">{error}</div>}

      {tab==="sites"&&<section className="panel">
        <div className="panel-head"><div><h2>مواقع ومستودعات غير محدودة</h2><p className="muted">كل مستودع GitHub يصبح مشروعاً مستقلاً داخل نفس مركز التحكم.</p></div></div>
        {role==="Super Admin"&&<form className="editor" onSubmit={saveSite}><div className="form-grid"><Field label="اسم المشروع"><input required value={siteDraft.name} onChange={e=>setSiteDraft({...siteDraft,name:e.target.value})}/></Field><Field label="GitHub repository"><input required placeholder="owner/repository" value={siteDraft.repo_full_name} onChange={e=>setSiteDraft({...siteDraft,repo_full_name:e.target.value})}/></Field><Field label="Branch"><input value={siteDraft.default_branch} onChange={e=>setSiteDraft({...siteDraft,default_branch:e.target.value})}/></Field><Field label="Base Path"><input value={siteDraft.base_path} onChange={e=>setSiteDraft({...siteDraft,base_path:e.target.value})}/></Field><Field label="رابط النشر"><input type="url" value={siteDraft.deployment_url} onChange={e=>setSiteDraft({...siteDraft,deployment_url:e.target.value})}/></Field><Field label="Supabase Project Ref"><input value={siteDraft.supabase_project_ref} onChange={e=>setSiteDraft({...siteDraft,supabase_project_ref:e.target.value})}/></Field></div><button className="btn">إضافة المستودع</button></form>}
        <div className="list">{sites.map(s=><div className="row" key={s.id}><div><strong>{s.name}</strong><div className="muted small">{s.repo_full_name} · {s.default_branch}</div></div><div className="actions"><button className="link-btn" onClick={()=>chooseSite(s)}>تشغيل</button>{role==="Super Admin"&&<button className="danger-btn" onClick={()=>deleteSite(s.id)}>حذف</button>}</div></div>)}</div>
      </section>}

      {tab==="editor"&&<RepositoryEditor site={site} role={role} onMessage={flash} onError={fail}/>}\n\n      {tab==="github"&&<section className="panel">
        <div className="panel-head"><div><h2>GitHub Releases / Artifacts</h2><p className="muted">{site?.repo_full_name||"اختر مستودعاً من تبويب المواقع."}</p></div><button className="btn" disabled={!site||gh.loading} onClick={()=>loadGithub()}>{gh.loading?"جارٍ...":"تحديث GitHub"}</button></div>
        {site?<><div className="stats"><div className="stat"><span>Repository</span><strong>{gh.summary?.stargazers_count??"—"}</strong><small>Stars</small></div><div className="stat"><span>Releases</span><strong>{gh.releases.length}</strong><small>آخر 20</small></div><div className="stat"><span>Artifacts</span><strong>{gh.artifacts.length}</strong><small>آخر 20</small></div><div className="stat"><span>Workflows</span><strong>{gh.workflows.length}</strong><small>متاحة</small></div></div><div className="grid-two"><section className="panel"><h3>Releases</h3>{gh.releases.map(r=><div className="row" key={r.id}><div><strong>{r.name||r.tag_name}</strong><div className="muted small">{r.tag_name}</div></div><a className="link-btn" href={r.html_url} target="_blank" rel="noreferrer">فتح</a></div>)}<button className="btn" onClick={syncReleases}>مزامنة Releases إلى Supabase</button></section><section className="panel"><h3>Artifacts</h3>{gh.artifacts.map(a=><div className="row" key={a.id}><div><strong>{a.name}</strong><div className="muted small">{a.expired?"منتهي":"صالح"} · {Math.round((a.size_in_bytes||0)/1024)} KB</div></div></div>)}</section></div></>:<p className="muted">أضف مستودعاً أولاً.</p>}
      </section>}

      {tab==="actions"&&<section className="panel"><div className="panel-head"><div><h2>حالة GitHub Actions</h2><p className="muted">تشغيل workflows ومراقبة آخر runs.</p></div><button className="btn" onClick={()=>loadGithub()} disabled={!site}>تحديث</button></div>{gh.workflows.map(w=><div className="row" key={w.id}><div><strong>{w.name}</strong><div className="muted small">{w.path}</div></div><button className="btn alt" onClick={()=>dispatch(w.id)}>تشغيل</button></div>)}<div className="table-wrap"><table><thead><tr><th>Workflow</th><th>Status</th><th>Conclusion</th><th>الوقت</th></tr></thead><tbody>{gh.runs.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.status}</td><td>{r.conclusion||"—"}</td><td>{new Date(r.created_at).toLocaleString("ar-MA")}</td></tr>)}</tbody></table></div></section>}

      {tab==="hadith"&&<section className="panel"><div className="panel-head"><div><h2>إدارة الحديث الشريف</h2><p className="muted">البخاري، مسلم، أبي داود، الترمذي، النسائي، ابن ماجه.</p></div><button className="btn alt" onClick={fetchHadithApi}>جلب من API</button></div><form className="editor" onSubmit={saveHadith}><div className="form-grid"><Field label="المجموعة"><select value={hadithDraft.collection} onChange={e=>setHadithDraft({...hadithDraft,collection:e.target.value})}>{books.map(b=><option key={b[0]} value={b[0]}>{b[1]}</option>)}</select></Field><Field label="رقم الحديث"><input value={hadithDraft.hadith_number} onChange={e=>setHadithDraft({...hadithDraft,hadith_number:e.target.value})}/></Field><Field label="العنوان"><input required value={hadithDraft.title} onChange={e=>setHadithDraft({...hadithDraft,title:e.target.value})}/></Field><Field label="المصدر"><input value={hadithDraft.source} onChange={e=>setHadithDraft({...hadithDraft,source:e.target.value})}/></Field><Field label="الدرجة"><input value={hadithDraft.grade} onChange={e=>setHadithDraft({...hadithDraft,grade:e.target.value})}/></Field></div><Field label="النص"><textarea rows="8" value={hadithDraft.body} onChange={e=>setHadithDraft({...hadithDraft,body:e.target.value})}/></Field><button className="btn">حفظ الحديث</button></form><Field label="بحث"><input value={hadithSearch} onChange={e=>setHadithSearch(e.target.value)} placeholder="بحث في الأحاديث المحلية"/></Field><div className="table-wrap"><table><thead><tr><th>المجموعة</th><th>العنوان</th><th>الرقم</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{filteredHadith.map(x=><tr key={x.id}><td>{x.collection}</td><td>{x.title}</td><td>{x.hadith_number||"—"}</td><td>{x.published?"منشور":"مسودة"}</td><td><button className="link-btn" onClick={()=>setHadithDraft(x)}>تعديل</button> <button className="danger-btn" onClick={()=>deleteHadith(x.id)}>حذف</button></td></tr>)}</tbody></table></div></section>}

      {tab==="users"&&<section className="panel"><div className="panel-head"><div><h2>المستخدمون والأدوار</h2><p className="muted">Super Admin / Content Manager / Release Manager.</p></div><button className="btn" onClick={loadUsers}>تحديث</button></div><div className="table-wrap"><table><thead><tr><th>البريد</th><th>الحالة</th><th>الدور</th><th>آخر دخول</th><th>إجراء</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.email||"—"}</td><td>{u.banned_until?"محظور":"نشط"}</td><td><select value={roleNames.includes(u.role)?u.role:""} onChange={e=>setRole(u.id,e.target.value)}><option value="">غير معيّن</option>{roleNames.map(r=><option key={r} value={r}>{r}</option>)}</select></td><td>{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString("ar-MA"):"لم يسجل بعد"}</td><td><button className="danger-btn" onClick={()=>removeRole(u.id)}>إزالة الدور</button></td></tr>)}</tbody></table></div></section>}

      {tab==="cache"&&<section className="panel"><div className="panel-head"><div><h2>Islamway والكاش</h2><p className="muted">عدد القراء: {quranReaders.length} · السور: {quranSurahs.length} · Cache rows: {cache.length}</p></div><div className="actions"><button className="btn alt" onClick={()=>{loadIslamway();loadCache()}}>تحديث</button><button className="btn" onClick={clearCache}>مسح الكاش</button></div></div><div className="table-wrap"><table><thead><tr><th>Cache Key</th><th>الانتهاء</th><th>آخر تحديث</th></tr></thead><tbody>{cache.map(c=><tr key={c.cache_key}><td>{c.cache_key}</td><td>{new Date(c.expires_at).toLocaleString("ar-MA")}</td><td>{new Date(c.updated_at).toLocaleString("ar-MA")}</td></tr>)}</tbody></table></div></section>}

      {tab==="preview"&&<section className="panel"><div className="panel-head"><div><h2>Live Preview</h2><p className="muted">معاينة الموقع المحدد من نفس مركز التحكم.</p></div></div><Field label="رابط المعاينة"><input type="url" value={preview} onChange={e=>setPreview(e.target.value)} placeholder="https://example.github.io/site/"/></Field>{preview?<iframe title="Live Preview" src={preview} style={{width:"100%",height:"70vh",border:"1px solid #dce7e0",borderRadius:16}}/>:<p className="muted">اختر موقعاً وأضف deployment URL.</p>}</section>}

      {tab==="android"&&<section className="panel"><div className="panel-head"><div><h2>Android وإعدادات التطبيق</h2><p className="muted">الإعدادات المركزية التي يمكن للتطبيق والمواقع قراءتها.</p></div></div><div className="grid-two"><section className="panel"><h3>إعدادات التطبيق</h3>{settings.map(s=><div className="row" key={s.key}><div><strong>{s.key}</strong><div className="muted small">{JSON.stringify(s.value)}</div></div><button className="link-btn" onClick={()=>saveSetting(s.key,prompt("قيمة JSON",JSON.stringify(s.value))||JSON.stringify(s.value))}>تعديل</button></div>)}</section><section className="panel"><h3>آخر Android Releases</h3>{gh.releases.slice(0,5).map(r=><div className="row" key={r.id}><div><strong>{r.name||r.tag_name}</strong><div className="muted small">{r.tag_name}</div></div><button className="link-btn" onClick={syncReleases}>مزامنة</button></div>)}</section></div></section>}
    </section>
  </main>
}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}