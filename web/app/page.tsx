import { getSupabaseServer } from "../lib/supabase/server";

export default async function Home() {
  const supabase = getSupabaseServer();
  const { data: content } = supabase
    ? await supabase
        .from("content_items")
        .select("id,type,title,slug,excerpt,image_url")
        .eq("published", true)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <main className="shell">
      <section className="hero">
        <span className="badge">WOW Platform</span>
        <h1>منصة واحدة للويب ولوحة التحكم والتطبيق</h1>
        <p>محتوى واحد يمكن إدارته من Supabase وعرضه على الموقع والتطبيق.</p>
        <div className="grid">
          <a href="/dashboard">لوحة التحكم</a>
          <a href="#content">المحتوى</a>
        </div>
      </section>

      <section id="content" className="card">
        <h2>آخر المحتوى</h2>
        {content?.length ? (
          <div>
            {content.map((item) => (
              <article key={item.id}>
                <h3>{item.title}</h3>
                {item.excerpt && <p>{item.excerpt}</p>}
              </article>
            ))}
          </div>
        ) : (
          <p>لم تتم إضافة محتوى منشور بعد.</p>
        )}
      </section>
    </main>
  );
}
