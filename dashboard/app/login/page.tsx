"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("أضف إعدادات Supabase أولاً.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="dashboard">
      <section className="panel">
        <h1>تسجيل الدخول</h1>
        <form onSubmit={submit}>
          <label>البريد الإلكتروني<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
          <label>كلمة المرور<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
          <button type="submit">دخول</button>
          {message && <p role="alert">{message}</p>}
        </form>
      </section>
    </main>
  );
}
