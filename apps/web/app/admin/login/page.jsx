"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {isAdmin,supabase} from "../../../lib/supabase";

export default function Login(){
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    (async()=>{
      const {data}=await supabase.auth.getUser();
      if(!active||!data.user)return;
      try{
        if(await isAdmin(data.user.id)) router.replace("/admin/dashboard/");
      }catch{}
    })();
    return()=>{active=false};
  },[router]);

  async function submit(e){
    e.preventDefault();
    setBusy(true);
    setError("");
    try{
      const {data,error}=await supabase.auth.signInWithPassword({
        email:email.trim(),
        password
      });
      if(error)throw error;
      if(!data.user)throw new Error("تعذر إنشاء جلسة الدخول");

      const admin=await isAdmin(data.user.id);
      if(!admin){
        await supabase.auth.signOut();
        throw new Error("تم تسجيل الدخول بنجاح، لكن الحساب غير موجود في قائمة مديري النظام.");
      }

      router.replace("/admin/dashboard/");
    }catch(e){
      const message=e?.message||"تعذر تسجيل الدخول.";
      if(message==="Invalid login credentials"){
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      }else if(message.includes("row-level security")||message.includes("permission")){
        setError("تم تسجيل الدخول، لكن تعذر التحقق من صلاحية المدير. تحقق من RLS وسياسة quran_app_admins.");
      }else{
        setError(message);
      }
    }finally{
      setBusy(false);
    }
  }

  return <main className="wrap">
    <form className="form" onSubmit={submit}>
      <h1>لوحة التحكم الجديدة</h1>
      <p className="muted">تسجيل الدخول عبر Supabase Auth.</p>
      {error&&<div className="error">{error}</div>}
      <div className="field">
        <label>البريد الإلكتروني</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
      </div>
      <div className="field">
        <label>كلمة المرور</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/>
      </div>
      <button className="btn" disabled={busy}>{busy?"جارٍ الدخول...":"تسجيل الدخول"}</button>
    </form>
  </main>;
}