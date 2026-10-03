"use client";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

export default function GitHubControlCenter({site,role,onMessage,onError}){
  const [tab,setTab]=useState("branches"),[data,setData]=useState({}),[loading,setLoading]=useState(false);
  const [base,setBase]=useState(""),[head,setHead]=useState(""),[issueTitle,setIssueTitle]=useState(""),[issueBody,setIssueBody]=useState("");
  const [prTitle,setPrTitle]=useState(""),[prBody,setPrBody]=useState(""),[prHead,setPrHead]=useState(""),[prBase,setPrBase]=useState(site?.default_branch||"main");
  const [secretName,setSecretName]=useState(""),[secretValue,setSecretValue]=useState(""),[varName,setVarName]=useState(""),[varValue,setVarValue]=useState("");
  const canWrite=role!=="Content Manager",superAdmin=role==="Super Admin";
  const invoke=async(action,extra={})=>{const {data,error}=await supabase.functions.invoke("github-ops",{body:{action,repo:site.repo_full_name,...extra}});if(error)throw error;if(data?.error)throw new Error(data.error+(data.details?.message?": "+data.details.message:""));return data.data};
  const load=async(kind=tab)=>{
    if(!site)return;
    setLoading(true);try{
      const d=await invoke(kind==="branches"?"branches":kind==="commits"?"commits":kind==="issues"?"issues":kind==="prs"?"prs":kind==="ci"?"runs":kind==="secrets"?"secrets":"variables");
      setData(x=>({...x,[kind]:d})); if(kind==="branches"){const names=(d||[]).map(x=>x.name);if(names.length&&!base)setBase(names[0]);if(names.length&&!head)setHead(names[0]);}
    }catch(e){onError?.(e)}finally{setLoading(false)}
  };
  useEffect(()=>{if(site){setPrBase(site.default_branch||"main");load("branches")}},[site?.id]);
  useEffect(()=>{if(site)load(tab)},[tab,site?.id]);

  const branches=data.branches||[], commits=data.commits||[], issues=data.issues||[], prs=data.prs||[], runs=data.ci||[];
  const secrets=data.secrets?.secrets||[], variables=data.variables?.variables||[];
  const compare=data.compare;
  async function compareRefs(){try{setLoading(true);const d=await invoke("compare",{base,head});setData(x=>({...x,compare:d}))}catch(e){onError?.(e)}finally{setLoading(false)}}
  async function createIssue(){if(!canWrite)return;try{await invoke("create_issue",{title:issueTitle,body:issueBody});setIssueTitle("");setIssueBody("");onMessage?.("تم إنشاء Issue.");load("issues")}catch(e){onError?.(e)}}
  async function createPr(){if(!canWrite)return;try{await invoke("create_pr",{title:prTitle,body:prBody,head:prHead,base:prBase});setPrTitle("");setPrBody("");onMessage?.("تم إنشاء Pull Request.");load("prs")}catch(e){onError?.(e)}}
  async function mergePr(number){if(!superAdmin)return onError?.("دمج PR متاح لـ Super Admin فقط.");if(!confirm("دمج PR #"+number+"؟"))return;try{await invoke("merge_pr",{number,merge_method:"squash"});onMessage?.("تم الدمج.");load("prs")}catch(e){onError?.(e)}}
  async function saveSecret(){if(!superAdmin)return onError?.("Secrets متاحة لـ Super Admin فقط.");try{await invoke("set_secret",{name:secretName,value:secretValue});setSecretName("");setSecretValue("");onMessage?.("تم تحديث Secret بأمان. القيمة لا تُعرض في المتصفح.");load("secrets")}catch(e){onError?.(e)}}
  async function deleteSecret(name){if(!superAdmin||!confirm("حذف Secret "+name+"؟"))return;try{await invoke("delete_secret",{name});load("secrets")}catch(e){onError?.(e)}}
  async function saveVariable(){if(!canWrite)return;try{await invoke("set_variable",{name:varName,value:varValue});setVarName("");setVarValue("");onMessage?.("تم حفظ Variable.");load("variables")}catch(e){onError?.(e)}}
  async function deleteVariable(name){if(!canWrite)return;if(!confirm("حذف Variable "+name+"؟"))return;try{await invoke("delete_variable",{name});load("variables")}catch(e){onError?.(e)}}
  const tabs=[["branches","الفروع"],["commits","Commits"],["compare","Diff / Compare"],["prs","Pull Requests"],["issues","Issues"],["ci","CI/CD"],["secrets","Secrets"],["variables","Variables"]];

  return <section className="panel">
    <div className="panel-head"><div><h2>GitHub Control Center</h2><p className="muted">{site?.repo_full_name||"اختر مستودعاً"} · {role}</p></div><button className="btn" onClick={()=>load(tab)} disabled={loading}>{loading?"جارٍ...":"تحديث"}</button></div>
    <div className="ops-tabs">{tabs.map(([id,label])=><button key={id} className={"link-btn "+(tab===id?"active":"")} onClick={()=>setTab(id)}>{label}</button>)}</div>

    {tab==="branches"&&<div className="grid-two"><section className="panel"><h3>Branches</h3>{branches.map(b=><div className="row" key={b.name}><div><strong>{b.name}</strong><div className="muted small">{b.protected?"Protected":""}</div></div><button className="link-btn" onClick={()=>{setBase(b.name);setHead(b.name)}}>اختيار</button></div>)}</section><section className="panel"><h3>Branch management</h3><p className="muted">إنشاء/حذف الفروع متاح من محرر الملفات أيضاً. الفرع الافتراضي محمي من الحذف.</p><a className="link-btn" href={"https://github.com/"+site.repo_full_name+"/branches"} target="_blank" rel="noreferrer">فتح Branches على GitHub ↗</a></section></div>}

    {tab==="commits"&&<div className="table-wrap"><table><thead><tr><th>SHA</th><th>الرسالة</th><th>المؤلف</th><th>التاريخ</th></tr></thead><tbody>{commits.map(c=><tr key={c.sha}><td>{c.sha.slice(0,8)}</td><td>{c.commit?.message?.split("\n")[0]}</td><td>{c.commit?.author?.name||c.author?.login||"—"}</td><td>{c.commit?.author?.date?new Date(c.commit.author.date).toLocaleString("ar-MA"):"—"}</td></tr>)}</tbody></table></div>}

    {tab==="compare"&&<div><div className="form-grid"><Field label="Base"><select value={base} onChange={e=>setBase(e.target.value)}>{branches.map(b=><option key={b.name}>{b.name}</option>)}</select></Field><Field label="Head"><select value={head} onChange={e=>setHead(e.target.value)}>{branches.map(b=><option key={b.name}>{b.name}</option>)}</select></Field></div><button className="btn" onClick={compareRefs} disabled={!base||!head}>عرض Diff</button>{compare&&<div className="panel"><h3>{compare.status||""} · +{compare.additions||0} / -{compare.deletions||0}</h3>{(compare.files||[]).map(f=><div className="row" key={f.filename}><strong>{f.filename}</strong><span className="muted">+{f.additions} / -{f.deletions}</span></div>)}</div>}</div>}

    {tab==="issues"&&<div><div className="editor"><Field label="العنوان"><input value={issueTitle} onChange={e=>setIssueTitle(e.target.value)} /></Field><Field label="الوصف"><textarea rows="5" value={issueBody} onChange={e=>setIssueBody(e.target.value)} /></Field><button className="btn" onClick={createIssue} disabled={!canWrite||!issueTitle}>إنشاء Issue</button></div>{issues.map(i=><div className="row" key={i.id}><div><strong>#{i.number} {i.title}</strong><div className="muted small">{i.state}</div></div><a className="link-btn" href={i.html_url} target="_blank" rel="noreferrer">فتح</a></div>)}</div>}

    {tab==="prs"&&<div><div className="editor"><div className="form-grid"><Field label="Title"><input value={prTitle} onChange={e=>setPrTitle(e.target.value)}/></Field><Field label="Head"><select value={prHead} onChange={e=>setPrHead(e.target.value)}><option value="">اختر الفرع</option>{branches.map(b=><option key={b.name}>{b.name}</option>)}</select></Field><Field label="Base"><select value={prBase} onChange={e=>setPrBase(e.target.value)}>{branches.map(b=><option key={b.name}>{b.name}</option>)}</select></Field></div><Field label="الوصف"><textarea rows="4" value={prBody} onChange={e=>setPrBody(e.target.value)}/></Field><button className="btn" onClick={createPr} disabled={!canWrite||!prTitle||!prHead}>إنشاء PR</button></div>{prs.map(p=><div className="row" key={p.id}><div><strong>#{p.number} {p.title}</strong><div className="muted small">{p.state} · {p.head?.ref} → {p.base?.ref}</div></div><div className="actions"><a className="link-btn" href={p.html_url} target="_blank" rel="noreferrer">فتح</a>{p.state==="open"&&<button className="btn alt" onClick={()=>mergePr(p.number)} disabled={!superAdmin}>Merge</button>}</div></div>)}</div>}

    {tab==="ci"&&<div><div className="table-wrap"><table><thead><tr><th>Workflow</th><th>Branch</th><th>Status</th><th>Conclusion</th><th>فتح</th></tr></thead><tbody>{runs.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.head_branch}</td><td>{r.status}</td><td>{r.conclusion||"—"}</td><td><a className="link-btn" href={r.html_url} target="_blank" rel="noreferrer">Run ↗</a></td></tr>)}</tbody></table></div><p className="muted">تشغيل Workflow يظل متاحاً من تبويب Actions، مع استخدام Edge Function كطبقة تفويض خادمية.</p></div>}

    {tab==="secrets"&&<div><div className="editor"><div className="form-grid"><Field label="Secret name"><input value={secretName} onChange={e=>setSecretName(e.target.value.toUpperCase())}/></Field><Field label="Secret value"><input type="password" autoComplete="new-password" value={secretValue} onChange={e=>setSecretValue(e.target.value)}/></Field></div><button className="btn" onClick={saveSecret} disabled={!superAdmin||!secretName||!secretValue}>حفظ Secret</button><p className="muted small">القيمة تُشفّر باستخدام GitHub public key داخل Edge Function ولا تُرسل إلى واجهة المستخدم.</p></div>{secrets.map(s=><div className="row" key={s.name}><strong>{s.name}</strong><div className="actions"><span className="muted">مخفي</span><button className="danger-btn" onClick={()=>deleteSecret(s.name)} disabled={!superAdmin}>حذف</button></div></div>)}</div>}

    {tab==="variables"&&<div><div className="editor"><div className="form-grid"><Field label="Variable name"><input value={varName} onChange={e=>setVarName(e.target.value.toUpperCase())}/></Field><Field label="Value"><input value={varValue} onChange={e=>setVarValue(e.target.value)}/></Field></div><button className="btn" onClick={saveVariable} disabled={!canWrite||!varName}>حفظ Variable</button></div>{variables.map(v=><div className="row" key={v.name}><div><strong>{v.name}</strong><div className="muted small">{v.value}</div></div><button className="danger-btn" onClick={()=>deleteVariable(v.name)} disabled={!canWrite}>حذف</button></div>)}</div>}
  </section>
}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
