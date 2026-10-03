"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../../../lib/supabase";
import RepositoryEditor from "./RepositoryEditor";
import GitHubControlCenter from "./GitHubControlCenter";

const roleNames=["Super Admin","Content Manager","Release Manager"];
export default function Operations(){
  const [tab,setTab]=useState("sites"),[user,setUser]=useState(null),[role,setCurrentRole]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [direction,setDirection]=useState(()=>typeof window!=="undefined"&&localStorage.getItem("admin-direction")||"rtl");
  const [sites,setSites]=useState([]),[site,setSite]=useState(null),[siteDraft,setSiteDraft]=useState({name:"",repo_full_name:"",default_branch:"main",base_path:"/",deployment_url:"",supabase_project_ref:"",enabled:true});
  const [gh,setGh]=useState({summary:null,releases:[],runs:[],artifacts:[],workflows:[],deployments:[],pages:null,loading:false});
  const [users,setUsers]=useState([]),[preview,setPreview]=useState("");

  const tabs=[["sites","المواقع"],["editor","محرر الملفات"],["control","GitHub Control Center"],["github","GitHub"],["deployments","Deployments"],["actions","Actions"],["users","المستخدمون والأدوار"],["preview","Live Preview"],["settings","إعدادات المشروع"]];

  function toggleDirection(){const d=direction==="rtl"?"ltr":"rtl";setDirection(d);try{localStorage.setItem("admin-direction",d)}catch{}}
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
      await loadUsers();
    }catch(e){fail(e)}
    finally{setLoading(false)}
  }

  useEffect(()=>{boot()},[]);

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
      const calls=["summary","releases","runs","artifacts","workflows","deployments","pages"];
      const out={};
      for(const action of calls){
        const {data,error}=await supabase.functions.invoke("github-ops",{body:{action,repo:s.repo_full_name}});
        if(error)throw error; if(data?.error)throw new Error(data.error+(data.details?.message?": "+data.details.message:""));
        out[action]=data.data;
      }
      setGh({summary:out.summary,releases:out.releases?.map(x=>x)||[],runs:out.runs?.workflow_runs||[],artifacts:out.artifacts?.artifacts||[],workflows:out.workflows?.workflows||[],deployments:out.deployments||[],pages:out.pages||null,loading:false});
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

  async function setRole(userId,newRole){
    const {data,error}=await supabase.functions.invoke("admin-users",{body:{action:"set_role",user_id:userId,role:newRole}});
    if(error)fail(error);else if(data?.error)fail(data.error);else{flash("تم تحديث الدور.");loadUsers()}
  }
  async function removeRole(userId){if(!confirm("إزالة الدور الإداري؟"))return;const {data,error}=await supabase.functions.invoke("admin-users",{body:{action:"remove_role",user_id:userId}});if(error)fail(error);else if(data?.error)fail(data.error);else loadUsers()}

  async function saveProjectSettings(patch){
    if(role!=="Super Admin")return fail("إعدادات المشروع متاحة لـ Super Admin فقط.");
    const {error}=await supabase.from("managed_sites").update(patch).eq("id",site.id);
    if(error)fail(error);else{flash("تم حفظ إعدادات المشروع.");boot()}
  }

  if(loading)return <main className="admin-shell" dir={direction}><div className="loading">جارٍ تحميل مركز التشغيل...</div></main>;

  return <main className="admin-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">ق</div><div><strong>مركز التشغيل</strong><small>{role}</small></div></div>
      <nav>{tabs.map(([id,label])=><button key={id} className={"side-link "+(tab===id?"active":"")} onClick={()=>setTab(id)}>{label}</button>)}</nav>
      <div className="sidebar-foot"><Link href="/admin/dashboard/">← لوحة التحكم الأساسية</Link></div>
    </aside>
    <section className="admin-main">
      <header className="admin-head"><div><p className="eyebrow">Operations Center</p><h1>{tabs.find(x=>x[0]===tab)?.[1]}</h1><p className="muted">{user?.email}</p></div><div className="actions"><button className="btn alt" onClick={toggleDirection}>{direction==="rtl"?"LTR":"RTL"}</button><Link className="btn alt" href="/admin/dashboard/">لوحة التحكم</Link></div></header>
      {message&&<div className="success">{message}</div>}{error&&<div className="error">{error}</div>}

      {tab==="sites"&&<section className="panel">
        <div className="panel-head"><div><h2>مواقع ومستودعات غير محدودة</h2><p className="muted">كل مستودع GitHub يصبح مشروعاً مستقلاً داخل نفس مركز التحكم.</p></div></div>
        {role==="Super Admin"&&<form className="editor" onSubmit={saveSite}><div className="form-grid"><Field label="اسم المشروع"><input required value={siteDraft.name} onChange={e=>setSiteDraft({...siteDraft,name:e.target.value})}/></Field><Field label="GitHub repository"><input required placeholder="owner/repository" value={siteDraft.repo_full_name} onChange={e=>setSiteDraft({...siteDraft,repo_full_name:e.target.value})}/></Field><Field label="Branch"><input value={siteDraft.default_branch} onChange={e=>setSiteDraft({...siteDraft,default_branch:e.target.value})}/></Field><Field label="Base Path"><input value={siteDraft.base_path} onChange={e=>setSiteDraft({...siteDraft,base_path:e.target.value})}/></Field><Field label="رابط النشر"><input type="url" value={siteDraft.deployment_url} onChange={e=>setSiteDraft({...siteDraft,deployment_url:e.target.value})}/></Field><Field label="Supabase Project Ref"><input value={siteDraft.supabase_project_ref} onChange={e=>setSiteDraft({...siteDraft,supabase_project_ref:e.target.value})}/></Field></div><button className="btn">إضافة المستودع</button></form>}
        <div className="list">{sites.map(s=><div className="row" key={s.id}><div><strong>{s.name}</strong><div className="muted small">{s.repo_full_name} · {s.default_branch}</div></div><div className="actions"><button className="link-btn" onClick={()=>chooseSite(s)}>تشغيل</button>{role==="Super Admin"&&<button className="danger-btn" onClick={()=>deleteSite(s.id)}>حذف</button>}</div></div>)}</div>
      </section>}

      {tab==="editor"&&<RepositoryEditor site={site} role={role} onMessage={flash} onError={fail}/>}

      {tab==="control"&&<GitHubControlCenter site={site} role={role} onMessage={flash} onError={fail}/>}

      {tab==="github"&&<section className="panel">
        <div className="panel-head"><div><h2>GitHub Releases / Artifacts</h2><p className="muted">{site?.repo_full_name||"اختر مستودعاً من تبويب المواقع."}</p></div><button className="btn" disabled={!site||gh.loading} onClick={()=>loadGithub()}>{gh.loading?"جارٍ...":"تحديث GitHub"}</button></div>
        {site?<><div className="stats"><div className="stat"><span>Repository</span><strong>{gh.summary?.stargazers_count??"—"}</strong><small>Stars</small></div><div className="stat"><span>Releases</span><strong>{gh.releases.length}</strong><small>آخر 20</small></div><div className="stat"><span>Artifacts</span><strong>{gh.artifacts.length}</strong><small>آخر 20</small></div><div className="stat"><span>Workflows</span><strong>{gh.workflows.length}</strong><small>متاحة</small></div></div><div className="grid-two"><section className="panel"><h3>Releases</h3>{gh.releases.map(r=><div className="row" key={r.id}><div><strong>{r.name||r.tag_name}</strong><div className="muted small">{r.tag_name}</div></div><a className="link-btn" href={r.html_url} target="_blank" rel="noreferrer">فتح</a></div>)}<button className="btn" onClick={syncReleases}>مزامنة Releases إلى Supabase</button></section><section className="panel"><h3>Artifacts</h3>{gh.artifacts.map(a=><div className="row" key={a.id}><div><strong>{a.name}</strong><div className="muted small">{a.expired?"منتهي":"صالح"} · {Math.round((a.size_in_bytes||0)/1024)} KB</div></div></div>)}</section></div></>:<p className="muted">أضف مستودعاً أولاً.</p>}
      </section>}

      {tab==="deployments"&&<section className="panel">
        <div className="panel-head"><div><h2>Deployment Center</h2><p className="muted">النشر لكل مستودع: GitHub Pages / Actions / Deployments.</p></div><button className="btn" onClick={()=>loadGithub()} disabled={!site}>تحديث الحالة</button></div>
        {!site?<p className="muted">اختر مستودعاً أولاً.</p>:<>
          <div className="stats">
            <div className="stat"><span>Pages</span><strong>{gh.pages?.enabled===false?"غير متاح":gh.pages?.status||"—"}</strong><small>{gh.pages?.html_url||"لم يتم ضبطه"}</small></div>
            <div className="stat"><span>Deployments</span><strong>{(gh.deployments||[]).length}</strong><small>آخر 30</small></div>
            <div className="stat"><span>Runs</span><strong>{gh.runs.length}</strong><small>آخر 30</small></div>
            <div className="stat"><span>Workflows</span><strong>{gh.workflows.length}</strong><small>متاحة</small></div>
          </div>
          <div className="grid-two">
            <section className="panel"><h3>النشر الحالي</h3>
              {(gh.deployments||[]).length?(gh.deployments||[]).map(d=><div className="row" key={d.id}>
                <div><strong>{d.environment||d.description||"Deployment"}</strong><div className="muted small">{d.ref||"—"} · {d.created_at?new Date(d.created_at).toLocaleString("ar-MA"):"—"}</div></div>
                <div className="actions"><a className="link-btn" href={"https://github.com/"+site.repo_full_name+"/deployments"} target="_blank" rel="noreferrer">حالة النشر ↗</a></div>
              </div>)):<p className="muted">لا توجد GitHub Deployments مسجلة.</p>}
            </section>
            <section className="panel"><h3>Production / Preview</h3>
              <Field label="Deployment URL"><input value={preview} onChange={e=>setPreview(e.target.value)} placeholder="https://example.github.io/project/"/></Field>
              <div className="actions"><button className="btn" onClick={()=>preview&&window.open(preview,"_blank","noopener,noreferrer")} disabled={!preview}>فتح Production</button><button className="btn alt" onClick={()=>site&&dispatch((gh.workflows||[]).find(w=>/deploy|pages|production/i.test(w.name+" "+w.path))?.id||"")}>Deploy</button></div>
              <p className="muted small">زر Deploy يستخدم Workflow نشر المستودع؛ لا يتم تنفيذ نشر عشوائي خارج GitHub Actions.</p>
            </section>
          </div>
          <section className="panel"><h3>آخر عمليات النشر عبر Actions</h3><div className="table-wrap"><table><thead><tr><th>Workflow</th><th>Branch</th><th>Status</th><th>Conclusion</th><th>Commit</th><th>إجراء</th></tr></thead><tbody>{gh.runs.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.head_branch}</td><td>{r.status}</td><td>{r.conclusion||"—"}</td><td>{String(r.head_sha||"").slice(0,8)}</td><td><div className="actions"><a className="link-btn" href={r.html_url} target="_blank" rel="noreferrer">فتح</a>{r.conclusion==="failure"&&<button className="btn alt" disabled={role==="Content Manager"} onClick={async()=>{try{const {data,error}=await supabase.functions.invoke("github-ops",{body:{action:"rerun_failed",repo:site.repo_full_name,run_id:r.id}});if(error)throw error;if(data?.error)throw new Error(data.error);flash("تمت إعادة تشغيل المهام الفاشلة.");loadGithub()}catch(e){fail(e)}}}>Retry failed</button>}</div></td></tr>)}</tbody></table></div></section>
        </>}
      </section>}

      {tab==="actions"&&<section className="panel"><div className="panel-head"><div><h2>حالة GitHub Actions</h2><p className="muted">تشغيل workflows ومراقبة آخر runs.</p></div><button className="btn" onClick={()=>loadGithub()} disabled={!site}>تحديث</button></div>{gh.workflows.map(w=><div className="row" key={w.id}><div><strong>{w.name}</strong><div className="muted small">{w.path}</div></div><button className="btn alt" onClick={()=>dispatch(w.id)}>تشغيل</button></div>)}<div className="table-wrap"><table><thead><tr><th>Workflow</th><th>Status</th><th>Conclusion</th><th>الوقت</th></tr></thead><tbody>{gh.runs.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.status}</td><td>{r.conclusion||"—"}</td><td>{new Date(r.created_at).toLocaleString("ar-MA")}</td></tr>)}</tbody></table></div></section>}

      {tab==="users"&&<section className="panel"><div className="panel-head"><div><h2>المستخدمون والأدوار</h2><p className="muted">Super Admin / Content Manager / Release Manager.</p></div><button className="btn" onClick={loadUsers}>تحديث</button></div><div className="table-wrap"><table><thead><tr><th>البريد</th><th>الحالة</th><th>الدور</th><th>آخر دخول</th><th>إجراء</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.email||"—"}</td><td>{u.banned_until?"محظور":"نشط"}</td><td><select value={roleNames.includes(u.role)?u.role:""} onChange={e=>setRole(u.id,e.target.value)}><option value="">غير معيّن</option>{roleNames.map(r=><option key={r} value={r}>{r}</option>)}</select></td><td>{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString("ar-MA"):"لم يسجل بعد"}</td><td><button className="danger-btn" onClick={()=>removeRole(u.id)}>إزالة الدور</button></td></tr>)}</tbody></table></div></section>}

      {tab==="preview"&&<section className="panel"><div className="panel-head"><div><h2>Live Preview</h2><p className="muted">معاينة الموقع المحدد من نفس مركز التحكم.</p></div></div><Field label="رابط المعاينة"><input type="url" value={preview} onChange={e=>setPreview(e.target.value)} placeholder="https://example.github.io/site/"/></Field>{preview?<iframe title="Live Preview" src={preview} style={{width:"100%",height:"70vh",border:"1px solid #dce7e0",borderRadius:16}}/>:<p className="muted">اختر موقعاً وأضف deployment URL.</p>}</section>}

      {tab==="settings"&&<section className="panel"><div className="panel-head"><div><h2>إعدادات المشروع</h2><p className="muted">إعدادات مستقلة لكل repository بدون أي اعتماد على مشروع أو API خارجي.</p></div></div>{site?<div className="editor"><div className="form-grid"><Field label="اسم المشروع"><input value={site.name||""} onChange={e=>setSite({...site,name:e.target.value})}/></Field><Field label="Repository"><input value={site.repo_full_name||""} readOnly/></Field><Field label="Default branch"><input value={site.default_branch||"main"} onChange={e=>setSite({...site,default_branch:e.target.value})}/></Field><Field label="Base path"><input value={site.base_path||"/"} onChange={e=>setSite({...site,base_path:e.target.value})}/></Field><Field label="Production URL"><input type="url" value={site.deployment_url||""} onChange={e=>setSite({...site,deployment_url:e.target.value})}/></Field><Field label="Enabled"><select value={site.enabled?"true":"false"} onChange={e=>setSite({...site,enabled:e.target.value==="true"})}><option value="true">Enabled</option><option value="false">Disabled</option></select></Field></div><div className="actions"><button className="btn" onClick={()=>saveProjectSettings({name:site.name,default_branch:site.default_branch,base_path:site.base_path,deployment_url:site.deployment_url||null,enabled:site.enabled})} disabled={role!=="Super Admin"}>حفظ الإعدادات</button><button className="btn alt" onClick={()=>setPreview(site.deployment_url||"")}>استخدام رابط النشر كـ Preview</button></div></div>:<p className="muted">اختر مستودعاً أولاً.</p>}</section>}
    </section>
  </main>
}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}