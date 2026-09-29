"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ContentItem = {
  id: string;
  type: "article" | "product" | "page";
  title: string;
  slug: string;
  published: boolean;
};

export default function Dashboard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("content_items")
        .select("id,type,title,slug,published")
        .order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="dashboard">
      <header>
        <h1>WOW Dashboard</h1>
        <span>Supabase Admin</span>
      </header>

      {!supabase && (
        <section className="panel">
          <h2>لم يتم ربط Supabase بعد</h2>
          <p>أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY إلى متغيرات البيئة ثم أعد تشغيل لوحة التحكم.</p>
        </section>
      )}

      {supabase && loading && <section className="panel"><p>جاري تحميل المحتوى…</p></section>}

      {supabase && !loading && (
        <section className="panel">
          <h2>المحتوى</h2>
          {items.length === 0 ? (
            <p>لا يوجد محتوى بعد. نفّذ migration ثم أضف أول عنصر من Supabase.</p>
          ) : (
            <div className="content-list">
              {items.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <small>{item.type} · /{item.slug} · {item.published ? "منشور" : "مسودة"}</small>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
