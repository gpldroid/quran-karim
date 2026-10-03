"use client";

import dynamic from "next/dynamic";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

const MonacoEditor=dynamic(()=>import("@monaco-editor/react"),{ssr:false});

const languageFor=(path)=>{
  const p=String(path||"").toLowerCase();
  if(p.endsWith(".js")||p.endsWith(".jsx"))return "javascript";
  if(p.endsWith(".ts")||p.endsWith(".tsx"))return "typescript";
  if(p.endsWith(".json"))return "json";
  if(p.endsWith(".css"))return "css";
  if(p.endsWith(".scss"))return "scss";
  if(p.endsWith(".html")||p.endsWith(".htm"))return "html";
  if(p.endsWith(".md")||p.endsWith(".mdx"))return "markdown";
  if(p.endsWith(".yml")||p.endsWith(".yaml"))return "yaml";
  if(p.endsWith(".xml")||p.endsWith(".svg"))return "xml";
  if(p.endsWith(".sql"))return "sql";
  if(p.endsWith(".sh")||p.endsWith(".bash"))return "shell";
  if(p.endsWith(".py"))return "python";
  return "plaintext";
};

export default function RepositoryEditor({site,role,onMessage,onError}){
  const [tree,setTree]=useState([]),[branch,setBranch]=useState(site?.default_branch||"main"),[selected,setSelected]=useState(null);
  const [content,setContent]=useState(""),[original,setOriginal]=useState(""),[sha,setSha]=useState(""),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
  const [query,setQuery]=useState(""),[commitMessage,setCommitMessage]=useState("Update file");
  const [showHidden,setShowHidden]=useState(true);

  const invoke=async(body)=>{
    const {data,error}=await supabase.functions.invoke("github-ops",{body:{...body,repo:site.repo_full_name,branch}});
    if(error)throw error;
    if(data?.error)throw new Error(data.error+(data.details?.message?": "+data.details.message:""));
    return data.data;
  };

  const loadTree=async()=>{
    if(!site)return;
    setLoading(true);
    try{const d=await invoke({action:"tree"});setTree(d.tree||[]);if(d.truncated)onError?.("GitHub أعاد شجرة مختصرة لأن المستودع كبير؛ استخدم البحث داخل GitHub للملفات الأبعد.");}
    catch(e){onError?.(e)}finally{setLoading(false)}
  };

  useEffect(()=>{setBranch(site?.default_branch||"main");setSelected(null);setContent("");setOriginal("");if(site)loadTree()},[site?.id,site?.default_branch]);

  const files=useMemo(()=>tree.filter(x=>x.type==="blob"&&(!query||x.path.toLowerCase().includes(query.toLowerCase()))&&(!(!showHidden)&&x.path.split("/").some(p=>p.startsWith(".")))),[tree,query,showHidden]);
  const folders=useMemo(()=>{
    const s=new Set();
    for(const f of files){const parts=f.path.split("/");if(parts.length>1)for(let i=1;i<parts.length;i++)s.add(parts.slice(0,i).join("/"))}
    return [...s].sort();
  },[files]);

  async function openFile(f){
    setSelected(f);setLoading(true);
    try{const d=await invoke({action:"file",path:f.path});setContent(d.content||"");setOriginal(d.content||"");setSha(d.sha||"");setCommitMessage("Update "+f.path)}
    catch(e){onError?.(e)}finally{setLoading(false)}
  }

  async function save(){
    if(!selected||role==="Content Manager")return onError?.("صلاحية تحرير المستودع متاحة لـ Super Admin و Release Manager.");
    if(content===original)return onMessage?.("لا توجد تغييرات للحفظ.");
    setSaving(true);
    try{const d=await invoke({action:"save_file",path:selected.path,sha,content,message:commitMessage||("Update "+selected.path)});setSha(d?.content?.sha||sha);setOriginal(content);onMessage?.("تم حفظ الملف مباشرة في GitHub.");await loadTree()}
    catch(e){onError?.(e)}finally{setSaving(false)}
  }

  async function createFile(){
    if(role==="Content Manager")return onError?.("ليس لديك صلاحية إنشاء ملفات.");
    const path=prompt("مسار الملف الجديد، مثال: apps/web/components/New.tsx");if(!path)return;
    const message=prompt("رسالة Commit","Create "+path)||("Create "+path);
    setSaving(true);
    try{await invoke({action:"create_file",path,content:"",message});onMessage?.("تم إنشاء الملف.");await loadTree();const f={path,type:"blob"};setSelected(f);setContent("");setOriginal("");setSha("")}
    catch(e){onError?.(e)}finally{setSaving(false)}
  }

  async function deleteSelected(){
    if(!selected||role==="Content Manager")return onError?.("ليس لديك صلاحية حذف الملفات.");
    if(!confirm("حذف "+selected.path+" من الفرع "+branch+"؟"))return;
    setSaving(true);
    try{await invoke({action:"delete_file",path:selected.path,sha,message:"Delete "+selected.path});onMessage?.("تم حذف الملف.");setSelected(null);setContent("");setOriginal("");setSha("");await loadTree()}
    catch(e){onError?.(e)}finally{setSaving(false)}
  }

  async function renameSelected(){
    if(!selected||role==="Content Manager")return onError?.("ليس لديك صلاحية إعادة التسمية.");
    const next=prompt("المسار الجديد",selected.path);if(!next||next===selected.path)return;
    setSaving(true);
    try{await invoke({action:"create_file",path:next,content,message:"Rename "+selected.path+" to "+next});await invoke({action:"delete_file",path:selected.path,sha,message:"Remove old path "+selected.path});onMessage?.("تمت إعادة التسمية.");await loadTree();setSelected({path:next,type:"blob"});setSha("");setOriginal(content)}
    catch(e){onError?.(e)}finally{setSaving(false)}
  }

  if(!site)return <div className="editor-empty">اختر مستودعاً من تبويب المواقع أولاً.</div>;

  return <section className="repo-editor">
    <div className="editor-toolbar">
      <div className="editor-repo"><strong>{site.repo_full_name}</strong><span>{tree.filter(x=>x.type==="blob").length} ملف</span></div>
      <div className="editor-actions">
        <select value={branch} onChange={e=>setBranch(e.target.value)}><option>{site.default_branch||"main"}</option></select>
        <button className="btn alt" onClick={loadTree} disabled={loading}>{loading?"جارٍ...":"تحديث الملفات"}</button>
        <button className="btn alt" onClick={createFile} disabled={saving||role==="Content Manager"}>+ ملف</button>
        {selected&&<button className="danger-btn" onClick={deleteSelected} disabled={saving||role==="Content Manager"}>حذف</button>}
      </div>
    </div>
    <div className="editor-layout">
      <aside className="file-manager">
        <div className="file-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث عن ملف..." /><button onClick={()=>setShowHidden(!showHidden)} title="إظهار الملفات المخفية">{showHidden?"◉":"○"}</button></div>
        <div className="file-count">{files.length} ملف · {folders.length} مجلد</div>
        <div className="file-list">
          {folders.map(f=><div className="file-folder" key={f}>▸ {f}</div>)}
          {files.map(f=><button key={f.path} className={"file-item "+(selected?.path===f.path?"selected":"")} onClick={()=>openFile(f)}><span>{iconFor(f.path)}</span><span>{f.path}</span></button>)}
          {!files.length&&!loading&&<div className="muted editor-empty">لا توجد ملفات مطابقة.</div>}
        </div>
      </aside>
      <section className="code-pane">
        <div className="code-head">
          <div><strong>{selected?.path||"لم يتم اختيار ملف"}</strong>{selected&&content!==original&&<span className="dirty">● غير محفوظ</span>}</div>
          {selected&&<div className="code-actions"><button className="link-btn" onClick={renameSelected} disabled={saving||role==="Content Manager"}>إعادة تسمية</button><a className="link-btn" href={"https://github.com/"+site.repo_full_name+"/blob/"+encodeURIComponent(branch)+"/"+selected.path} target="_blank" rel="noreferrer">GitHub ↗</a></div>}
        </div>
        {selected?<><div className="commit-bar"><input value={commitMessage} onChange={e=>setCommitMessage(e.target.value)} placeholder="رسالة Commit" /><button className="btn" onClick={save} disabled={saving||role==="Content Manager"||content===original}>{saving?"جارٍ الحفظ...":"حفظ Commit"}</button></div><div className="monaco-wrap"><MonacoEditor height="calc(100vh - 360px)" language={languageFor(selected.path)} theme="vs-dark" value={content} onChange={v=>setContent(v??"")} options={{automaticLayout:true,minimap:{enabled:true},fontSize:14,lineNumbers:"on",wordWrap:"on",scrollBeyondLastLine:false,tabSize:2,renderWhitespace:"selection",stickyScroll:{enabled:true},bracketPairColorization:{enabled:true},padding:{top:12}}}/></div></>:<div className="editor-placeholder"><div>⌘</div><h3>محرر GitHub احترافي</h3><p>اختر ملفاً من مدير الملفات لتحريره، ثم أنشئ Commit مباشرة إلى الفرع المحدد.</p></div>}
      </section>
    </div>
  </section>
}

function iconFor(path){const p=path.toLowerCase();if(p.endsWith(".tsx")||p.endsWith(".ts"))return "TS";if(p.endsWith(".jsx")||p.endsWith(".js"))return "JS";if(p.endsWith(".css"))return "CSS";if(p.endsWith(".json"))return "{}";if(p.endsWith(".md"))return "MD";if(p.endsWith(".html"))return "HT";if(p.endsWith(".yml")||p.endsWith(".yaml"))return "YML";return "•"}
