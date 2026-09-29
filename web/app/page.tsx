export default function Home() {
  return <main className="shell">
    <section className="hero">
      <span className="badge">WOW Platform</span>
      <h1>منصة واحدة للويب ولوحة التحكم والتطبيق</h1>
      <p>بنية حديثة قابلة للتوسع، مع GitHub كمصدر واحد للكود وSupabase كطبقة بيانات وAPI.</p>
      <div className="grid">
        <a href="/dashboard">لوحة التحكم</a>
        <a href="#architecture">البنية التقنية</a>
      </div>
    </section>
    <section id="architecture" className="card">
      <h2>Architecture</h2>
      <p>Next.js + Supabase + Android + GitHub Actions. لا توجد مفاتيح إنتاجية داخل المستودع.</p>
    </section>
  </main>;
}
