"use client";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";

export default function Home() {
  return (
    <main dir="rtl" style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",background:"#080d18",color:"#f8fafc"}}>
      <section style={{width:"min(92%,560px)",padding:"34px",border:"1px solid #263247",borderRadius:"24px",background:"#111827",boxShadow:"0 24px 70px #0008",textAlign:"center"}}>
        <div style={{width:"72px",height:"72px",margin:"0 auto 18px",borderRadius:"20px",display:"grid",placeItems:"center",background:"linear-gradient(135deg,#7c3aed,#2563eb)",fontSize:"28px",fontWeight:900}}>W</div>
        <h1 style={{margin:"0 0 10px",fontSize:"30px"}}>WOW Dashboard</h1>
        <p style={{margin:"0 auto 26px",color:"#94a3b8",lineHeight:1.8}}>بوابة الوصول إلى لوحة التحكم وإدارة المحتوى والتصنيفات وإعدادات المنصة.</p>
        <div style={{display:"grid",gap:"12px"}}>
          <a href={BASE+"/dashboard/"} style={{display:"block",padding:"14px 18px",borderRadius:"14px",textDecoration:"none",fontWeight:800,border:"1px solid #2563eb",color:"#fff",background:"#2563eb"}}>دخول لوحة التحكم</a>
          <a href={BASE+"/login/"} style={{display:"block",padding:"14px 18px",borderRadius:"14px",textDecoration:"none",fontWeight:800,border:"1px solid #334155",color:"#e2e8f0",background:"#172033"}}>تسجيل الدخول</a>
          <a href={BASE+"/content/"} style={{display:"block",padding:"14px 18px",borderRadius:"14px",textDecoration:"none",fontWeight:800,border:"1px solid #334155",color:"#e2e8f0",background:"#172033"}}>فتح المحتوى</a>
        </div>
        <small style={{display:"block",marginTop:"20px",color:"#64748b"}}>WOW Platform · Web + Android + Supabase</small>
      </section>
    </main>
  );
}
