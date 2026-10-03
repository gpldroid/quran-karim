"use client";

import dynamic from "next/dynamic";
import {useEffect,useMemo,useRef,useState} from "react";
import {supabase} from "../../../lib/supabase";

const MonacoEditor=dynamic(()=>import("@monaco-editor/react"),{ssr:false});
const DiffEditor=dynamic(()=>import("@monaco-editor/react").then(m=>m.DiffEditor),{ssr:false});

const languageFor=(path)=>{
  const p=String(path||"").toLowerCase();
  if(/\.(js|jsx)$/.test(p))return "javascript";
  if(/\.(ts|tsx)$/.test(p))return "typescript";
  if(p.endsWith(".json"))return "json";
  if(p.endsWith(".css"))return "css";
  if(p.endsWith(".scss"))return "scss";
  if(/\.html?$/.test(p))return "html";
  if(/\.mdx?$/.test(p))return "markdown";
  if(/\.ya?ml$/.test(p))return "yaml";
  if(/\.(xml|svg)$/.test(p))return "xml";
  if(p.endsWith(".sql"))return "sql";
  if(/\.(sh|bash)$/.test(p))return "shell";
  if(p.endsWith(".py"))return "python";
  return "plaintext";
};

export default function RepositoryEditor({site,role,onMessage,onError}){
  const [tree,setTree]=useState([]),[branches,setBranches]=useState([]),[branch,setBranch]=useState(site?.default_branch||"main"),[selected,setSelected]=useState(null);
  const [content,setContent]=useState(""),[original,setOriginal]=useState(""),[sha,setSha]=useState(""),[downloadUrl,setDownloadUrl]=useState("");
  const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[query,setQuery]=useState(""),[commitMessage,setCommitMessage]=useState("Update file");
  const [showHidden,setShowHidden]=useState(true),[showDiff,setShowDiff]=useState(false),[replaceFrom,setReplaceFrom]=useState(""),[replaceTo,setReplaceTo]=useState("");
  const uploadRef=useRef(null);
  const canWrite=role!=="Content Manager";

  const invoke=async(body)=>{
    const {data,error}=await supabase.functions.invoke("github-ops",{body:{...body,repo:site.repo_full_name,branch}});
    if(error)throw error;
    if(data?.error)throw new Error(data.error+(data.details?.message?": "+data.details.message:""));
    return data.data;
  };

  const loadBranches=async()=>{
    try{const d=await invoke({action:"branches"});setBranches(d||[]);if(!branch)setBranch(site.default_branch||"main")}
    catch(e){onError?.(e)}
  };
  const loadTree=async()=>{
    if(!site)return;
    setLoading(true);
    try{const d=await invoke({action:"tree"});setTree(d.tree||[]);if(d.truncated)onError?.("المستودع كبير؛ GitHub أعاد شجرة مختصرة. استخدم GitHub مباشرة للملفات خارج الحد.");}
    catch(e){onError?.(e)}finally{setLoading(false)}
  };
  useEffect(()=>{setBranch(site?.default_branch||"main");setSelected(null);setContent("");setOriginal("");if(site){loadBranches();loadTree()}},[site?.id,site?.default_branch]);
  useEffect(()=>{if(site)loadTree()},[branch]);

  const files=useMemo(()=>tree.filter(x=>x.type==="blob"&&(!query||x.path.toLowerCase().includes(query.toLowerCase()))&&(!(!showHidden)&&x.path.split("/").some(p=>p.startsWith(".")))),[tree,query,showHidden]);
  const folders=useMemo(()=>{const s=new Set();for(const f of files){const p=f.path.split("/");for(let i=1;i<p.length;i++)s.add(p.slice(0,i).join("/"))}return [...s].sort()},[files]);

  async function openFile(f){
    setSelected(f);setLoading(true);
    try{const d=await invoke({action:"file",path:f.path});setContent(d.content||"");setOriginal(d.content||"");setSha(d.sha||"");setDownloadUrl(d.download_url||"");setCommitMessage("Update "+f.path);setShowDiff(false)}
    catch(e){onError?.(e)}finally{setLoading(false)}
  }
  async function save(){
    if(!selected||!canWrite)return onError?.("ليس لديك صلاحية الكتابة.");
    if(content===original)return onMessage?.("لا توجد تغييرات للحفظ.");
    setSaving(true);
    try{const d=await invoke({action:"save_file",path:selected.path,sha,content,message:commitMessage||("Update "+selected.path)});setSha(d?.content?.sha||sha);setOriginal(content);onMessage?.("تم حفظ Commit في GitHub.");await loadTree()}
    catch(e){onError?.(e)}finally{setSaving(false)}
  }
  async function createFile(){
    if(!canWrite)return onError?.("ليس لديك صلاحية إنشاء الملفات.");
    const path=prompt("مسار الملف الجديد");if(!path)return;
    const message=prompt("رسالة Commit","Create "+path)||("Create "+path);
    setSaving(true);try{await invoke({action:"create_file",path,content:"",message});onMessage?.("تم إنشاء الملف.");await loadTree()}catch(e){onError?.(e)}finally{setSaving(false)}
  }
  async function createFolder(){
    if(!canWrite)return onError?.("ليس لديك صلاحية إنشاء المجلدات.");
    const folder=prompt("مسار المجلد، مثال: apps/web/components");if(!folder)return;
    const path=folder.replace(/\/+$/,"")+"/.gitkeep";
    setSaving(true);try{await invoke({action:"create_file",path,content:"",message:"Create folder "+folder});onMessage?.("تم إنشاء المجلد عبر .gitkeep.");await loadTree()}catch(e){onError?.(e)}finally{setSaving(false)}
  }
  async function deleteSelected(){
    if(!selected||!canWrite)return;
    if(!confirm("حذف "+selected.path+" من "+branch+"؟"))return;
    setSaving(true);try{await invoke({action:"delete_file",path:selected.path,sha,message:"Delete "+selected.path});setSelected(null);setContent("");setOriginal("");onMessage?.("تم حذف الملف.");await loadTree()}catch(e){onError?.(e)}finally{setSaving(false)}
  }
  async function renameSelected(){
    if(!selected||!canWrite)return;
    const next=prompt("المسار الجديد",selected.path);if(!next||next===selected.path)return;
    setSaving(true);try{await invoke({action:"create_file",path:next,content,message:"Rename "+selected.path+" to "+next});await invoke({action:"delete_file",path:selected.path,sha,message:"Remove old path "+selected.path});setSelected({path:next,type:"blob"});setSha("");setOriginal(content);onMessage?.("تمت إعادة التسمية.");await loadTree()}catch(e){onError?.(e)}finally{setSaving(false)}
  }
  async function createBranch(){
    if(!canWrite)return;
    const name=prompt("اسم الفرع الجديد");if(!name)return;
    try{await invoke({action:"create_branch",name,from:branch});flashBranch(name)}catch(e){onError?.(e)}
  }
  async function flashBranch(name){onMessage?.("تم إنشاء الفرع "+name);await loadBranches();setBranch(name)}
  async function deleteBranch(){
    if(!canWrite||branch===site.default_branch)return onError?.("لا يمكن حذف الفرع الافتراضي من هنا.");
    if(!confirm("حذف الفرع "+branch+"؟"))return;
    try{await invoke({action:"delete_branch",name:branch});onMessage?.("تم حذف الفرع.");setBranch(site.default_branch||"main");await loadBranches()}catch(e){onError?.(e)}
  }
  async function uploadFile(e){
    const file=e.target.files?.[0];e.target.value="";if(!file)return;
    if(!canWrite)return onError?.("ليس لديك صلاحية الرفع.");
    const path=prompt("المسار داخل المستودع",file.name);if(!path)return;
    setSaving(true);
    try{
      const reader=new FileReader();
      reader.onload=async()=>{
        try{const raw=String(reader.result||""),base64=raw.split(",")[1]||"";await invoke({action:"create_file",path,binary_base64:base64,message:"Upload "+path});onMessage?.("تم رفع الملف.");await loadTree()}catch(err){onError?.(err)}finally{setSaving(false)}
      };
      reader.readAsDataURL(file);
    }catch(e2){setSaving(false);onError?.(e2)}
  }
  function downloadFile(){
    if(!selected)return;
    if(downloadUrl){window.open(downloadUrl,"_blank","noopener,noreferrer");return}
    const blob=new Blob([content],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=selected.path.split("/").pop();a.click();URL.revokeObjectURL(url);
  }
  function replaceAll(){
    if(!replaceFrom)return;
    setContent(v=>v.split(replaceFrom).join(replaceTo));
  }

  if(!site)return <div className="editor-empty">اختر مستودعاً من تبويب المواقع أولاً.</div>;
  return <section className="repo-editor">
    <div className="editor-toolbar">
      <div className="editor-repo"><strong>{site.repo_full_name}</strong><span>{tree.filter(x=>x.type==="blob").length} ملف · {branches.length} فرع</span></div>
      <div className="editor-actions">
        <select value={branch} onChange={e=>setBranch(e.target.value)}>{(branches.length?branches:[{name:site.default_branch||"main"}]).map(b=><option key={b.name} value={b.name}>{b.name}</option>)}</select>
        <button className="btn alt" onClick={createBranch} disabled={!canWrite}>+ فرع</button>
        <button className="btn alt" onClick={deleteBranch} disabled={!canWrite||branch===site.default_branch}>حذف الفرع</button>
        <button className="btn alt" onClick={loadTree} disabled={loading}>{loading?"جارٍ...":"تحديث"}</button>
        <button className="btn alt" onClick={createFolder} disabled={!canWrite}>+ مجلد</button>
        <button className="btn alt" onClick={createFile} disabled={!canWrite}>+ ملف</button>
        <button className="btn alt" onClick={()=>uploadRef.current?.click()} disabled={!canWrite||saving}>رفع</button>
        <input ref={uploadRef} type="file" hidden onChange={uploadFile}/>
      </div>
    </div>
    <div className="editor-layout">
      <aside className="file-manager">
        <div className="file-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث عن ملف..." /><button onClick={()=>setShowHidden(!showHidden)}>{showHidden?"◉":"○"}</button></div>
        <div className="file-count">{files.length} ملف · {folders.length} مجلد</div>
        <div className="file-list">{folders.map(f=><div className="file-folder" key={f}>▸ {f}</div>)}{files.map(f=><button key={f.path} className={"file-item "+(selected?.path===f.path?"selected":"")} onClick={()=>openFile(f)}><span>{iconFor(f.path)}</span><span>{f.path}</span></button>)}{!files.length&&!loading&&<div className="muted editor-empty">لا توجد ملفات مطابقة.</div>}</div>
      </aside>
      <section className="code-pane">
        <div className="code-head"><div><strong>{selected?.path||"لم يتم اختيار ملف"}</strong>{selected&&content!==original&&<span className="dirty">● غير محفوظ</span>}</div>{selected&&<div className="code-actions"><button className="link-btn" onClick={()=>setShowDiff(v=>!v)}>{showDiff?"المحرر":"Diff"}</button><button className="link-btn" onClick={renameSelected} disabled={!canWrite||saving}>إعادة تسمية</button><button className="link-btn" onClick={downloadFile}>تنزيل</button><button className="danger-btn" onClick={deleteSelected} disabled={!canWrite||saving}>حذف</button></div>}</div>
        {selected&&<div className="commit-bar"><input value={commitMessage} onChange={e=>setCommitMessage(e.target.value)} placeholder="رسالة Commit"/><input value={replaceFrom} onChange={e=>setReplaceFrom(e.target.value)} placeholder="بحث"/><input value={replaceTo} onChange={e=>setReplaceTo(e.target.value)} placeholder="استبدال"/><button className="btn alt" onClick={replaceAll}>استبدال الكل</button><button className="btn" onClick={save} disabled={saving||!canWrite||content===original}>{saving?"جارٍ...":"حفظ Commit"}</button></div>}
        {selected?(showDiff?<DiffEditor height="calc(100vh - 360px)" language={languageFor(selected.path)} theme="vs-dark" original={original} modified={content} options={{automaticLayout:true,readOnly:true,renderSideBySide:true,minimap:{enabled:false}}}/>:<MonacoEditor height="calc(100vh - 360px)" language={languageFor(selected.path)} theme="vs-dark" value={content} onChange={v=>setContent(v??"")} options={{automaticLayout:true,minimap:{enabled:true},fontSize:14,lineNumbers:"on",wordWrap:"on",scrollBeyondLastLine:false,tabSize:2,renderWhitespace:"selection",stickyScroll:{enabled:true},bracketPairColorization:{enabled:true},padding:{top:12}}}/>):<div className="editor-placeholder"><div>⌘</div><h3>GitHub Web IDE</h3><p>فروع، ملفات، مجلدات، رفع/تنزيل، بحث واستبدال، Diff وCommits مباشرة من المتصفح.</p></div>}
      </section>
    </div>
  </section>
}
function iconFor(path){const p=path.toLowerCase();if(/\.(tsx|ts)$/.test(p))return "TS";if(/\.(jsx|js)$/.test(p))return "JS";if(p.endsWith(".css"))return "CSS";if(p.endsWith(".json"))return "{}";if(p.endsWith(".md"))return "MD";if(p.endsWith(".html"))return "HT";if(/\.ya?ml$/.test(p))return "YML";return "•"}
