"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ContentItem = {
  id: string;
  type: "article" | "product" | "page";
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  image_url: string | null;
  published: boolean;
};

const emptyForm = {
  type: "article" as ContentItem["type"],
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  image_url: "",
  published: false,
};

export default function Dashboard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("content_items")
      .select("id,type,title,slug,excerpt,body,image_url,published")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  }

  function editItem(item: ContentItem) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt ?? "",
      body: item.body ?? "",
      image_url: item.image_url ?? "",
      published: item.published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setMessage("");

    const payload = {
      type: form.type,
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      body: form.body.trim() || null,
      image_url: form.image_url.trim() || null,
      published: form.published,
    };

    const result = editingId
      ? await supabase.from("content_items").update(payload).eq("id", editingId)
      : await supabase.from("content_items").insert(payload);

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(editingId ? "تم تحديث المحتوى." : "تمت إضافة المحتوى.");
      resetForm();
      await load();
    }
    setSaving(false);
  }

  async function removeItem(id: string) {
    if (!supabase || !window.confirm("هل تريد حذف هذا المحتوى؟")) return;
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("تم حذف المحتوى.");
      await load();
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="dashboard" dir="rtl">
      <header className="dashboard-header">
        <div>
          <h1>WOW Dashboard</h1>
          <span>إدارة المحتوى المتصل بالتطبيق والموقع</span>
        </div>
        <button type="button" onClick={logout}>تسجيل الخروج</button>
      </header>

      {!supabase ? (
        <section className="panel">
          <h2>إعداد Supabase مطلوب</h2>
          <p>أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY إلى بيئة لوحة التحكم.</p>
        </section>
      ) : (
        <>
          <section className="stats">
            <article><b>{items.length}</b><small>إجمالي المحتوى</small></article>
            <article><b>{items.filter((item) => item.published).length}</b><small>منشور</small></article>
            <article><b>{items.filter((item) => !item.published).length}</b><small>مسودة</small></article>
          </section>

          <section className="panel">
            <div className="section-title">
              <h2>{editingId ? "تعديل المحتوى" : "إضافة محتوى"}</h2>
              {editingId && <button type="button" onClick={resetForm}>إلغاء التعديل</button>}
            </div>
            <form className="editor-form" onSubmit={save}>
              <div className="form-grid">
                <label>النوع
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContentItem["type"] })}>
                    <option value="article">مقال</option>
                    <option value="product">منتج</option>
                    <option value="page">صفحة</option>
                  </select>
                </label>
                <label>العنوان
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </label>
                <label>الرابط المختصر (Slug)
                  <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </label>
                <label>رابط الصورة
                  <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                </label>
              </div>
              <label>المقتطف
                <textarea rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              </label>
              <label>المحتوى
                <textarea rows={7} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </label>
              <label className="checkbox"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> نشر المحتوى</label>
              <button className="primary" disabled={saving} type="submit">{saving ? "جارٍ الحفظ…" : editingId ? "حفظ التعديلات" : "إضافة المحتوى"}</button>
              {message && <p className="message" role="status">{message}</p>}
            </form>
          </section>

          <section className="panel">
            <div className="section-title">
              <h2>المحتوى</h2>
              <button type="button" onClick={load}>تحديث</button>
            </div>
            {loading ? <p>جاري التحميل…</p> : items.length === 0 ? <p>لا يوجد محتوى بعد.</p> : (
              <div className="content-list">
                {items.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.type} · /{item.slug} · {item.published ? "منشور" : "مسودة"}</small>
                    </div>
                    <div className="actions">
                      <button type="button" onClick={() => editItem(item)}>تعديل</button>
                      <button type="button" onClick={() => removeItem(item.id)}>حذف</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
