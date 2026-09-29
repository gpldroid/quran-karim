"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase/client";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";
export default function LoginPage(){const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [message,setMessage]=useState("");async function submit(event:FormEvent){event.preventDefault();setMessage("");if(!supabase){setMessage("إعدادات Supabase غير موجودة.");return;}const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setMessage(error.message);return;}window.location.href=BASE+"/dashboard/";}return <main className="shell" dir="rtl"><section className="auth-card"><h1>تسجيل الدخول</h1><p>الدخول إلى لوحة إدارة WOW.</p><form onSubmit={submit}><label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary" type="submit">دخول</button>{message&&<p className="message" role="alert">{message}</p>}</form></section></main>}
