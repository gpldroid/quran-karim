"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";

type Role = "admin" | "editor";
type ItemType = "article" | "product" | "page";
type Category = { id: string; name: string; slug: string; description: string | null };
type Item = { id: string; type: ItemType; title: string; slug: string; excerpt: string | null; body: string | null; image_url: string | null; published: boolean; featured: boolean; category_id: string | null };
type Settings = { id: boolean; site_name: string; site_description: string; logo_url: string | null; primary_color: string; maintenance_mode: boolean; contact_email: string | null };

const emptyItem = { type: "article" as ItemType, title: "", slug: "", excerpt: "", body: "", image_url: "", published: false, featured: false, category_id: "" };
const emptyCategory = { name: "", slug: "", description: "" };\nconst BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [itemForm, setItemForm] = useState(emptyItem);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const [{ data: userData }, { data: profile }, { data: content }, { data: cats }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("role").single(),
      supabase.from("content_items").select("id,type,title,slug,excerpt,body,image_url,published,featured,category_id").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name,slug,description").order("name")
    ]);
    setEmail(userData.user?.email ?? "");
    setRole((profile?.role as Role) ?? null);
    setItems(content ?? []);
    setCategories(cats ?? []);
    if (profile?.role === "admin") {
      const { data } = await supabase.from("app_settings").select("*").eq("id", true).single();
      setSettings(data);
    }
    setLoading(false);
  }

  useEffect(() => {\n    let mounted = true;\n    if (!supabase) { setLoading(false); return; }\n    supabase.auth.getUser().then(({ data }) => {\n      if (mounted && !data.user) window.location.href = BASE + "/login/";\n    });\n    load();\n    return () => { mounted = false; };\n  }, []);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("dashboard-content-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_items" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter(x => (x.title + " " + x.slug).toLowerCase().includes(q)) : items;
  }, [items, search]);

  function resetItem() { setItemForm(emptyItem); setEditing(null); }
  function editItem(x: Item) {
    setEditing(x.id);
    setItemForm({ type: x.type, title: x.title, slug: x.slug, excerpt: x.excerpt ?? "", body: x.body ?? "", image_url: x.image_url ?? "", published: x.published, featured: x.featured, category_id: x.category_id ?? "" });
    setTab("content");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true); setMessage("");
    const payload = { type: itemForm.type, title: itemForm.title.trim(), slug: itemForm.slug.trim(), excerpt: itemForm.excerpt.trim() || null, body: itemForm.body.trim() || null, image_url: itemForm.image_url.trim() || null, published: itemForm.published, featured: itemForm.featured, category_id: itemForm.category_id || null };
    const result = editing ? await supabase.from("content_items").update(payload).eq("id", editing) : await supabase.from("content_items").insert(payload);
    if (result.error) setMessage(result.error.message);
    else { setMessage(editing ? "تم تحديث المحتوى." : "تمت إضافة المحتوى."); resetItem(); await load(); }
    setSaving(false);
  }

  async function removeItem(id: string) {
    if (!supabase || !confirm("هل تريد حذف هذا المحتوى؟")) return;
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    setMessage(error?.message ?? "تم حذف المحتوى."); if (!error) await load();
  }

  async function saveCategory(e: FormEvent) {
    e.preventDefault(); if (!supabase) return; setSaving(true);
    const payload = { name: categoryForm.name.trim(), slug: categoryForm.slug.trim(), description: categoryForm.description.trim() || null };
    const result = editingCategory ? await supabase.from("categories").update(payload).eq("id", editingCategory) : await supabase.from("categories").insert(payload);
    setMessage(result.error?.message ?? (editingCategory ? "تم تحديث التصنيف." : "تمت إضافة التصنيف."));
    if (!result.error) { setCategoryForm(emptyCategory); setEditingCategory(null); await load(); }
    setSaving(false);
  }

  async function removeCategory(id: string) {
    if (!supabase || !confirm("حذف التصنيف؟ سيبقى المحتوى دون تصنيف.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    setMessage(error?.message ?? "تم حذف التصنيف."); if (!error) await load();
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault(); if (!supabase || !settings || role !== "admin") return; setSaving(true);
    const { error } = await supabase.from("app_settings").update({ site_name: settings.site_name, site_description: settings.site_description, logo_url: settings.logo_url || null, primary_color: settings.primary_color, maintenance_mode: settings.maintenance_mode, contact_email: settings.contact_email || null }).eq("id", true);
    setMessage(error?.message ?? "تم حفظ إعدادات المنصة."); setSaving(false);
  }

  async function logout() { if (supabase) await supabase.auth.signOut(); location.href = BASE + "/login/"; }

  const published = items.filter(x => x.published).length;
  const drafts = items.length - published;
  const featured = items.filter(x => x.featured).length;

  return <main className="dashboard" dir="rtl">
    <header className="dashboard-header">
      <div><h1>WOW Dashboard</h1><span>{email || "لوحة الإدارة"} · {role === "admin" ? "مدير" : "محرر"}</span></div>
      <div className="actions"><a href={BASE + "/"}>الموقع</a><button onClick={logout}>تسجيل الخروج</button></div>
    </header>

    <nav className="dashboard-nav" aria-label="أقسام لوحة التحكم">
      {["overview","content","categories",...(role === "admin" ? ["settings"] : [])].map(x => <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x === "overview" ? "نظرة عامة" : x === "content" ? "المحتوى" : x === "categories" ? "التصنيفات" : "إعدادات المنصة"}</button>)}
    </nav>

    {loading ? <section className="panel"><p>جاري تحميل لوحة التحكم…</p></section> : <>
      {tab === "overview" && <section className="dashboard-home">
        <div className="stats"><article><b>{items.length}</b><small>إجمالي المحتوى</small></article><article><b>{published}</b><small>منشور</small></article><article><b>{drafts}</b><small>مسودات</small></article><article><b>{featured}</b><small>مميز</small></article></div>
        <section className="panel"><h2>جاهزية المنصة</h2><div className="check-grid"><p>✓ قاعدة المحتوى: جاهزة</p><p>✓ التصنيفات: {categories.length}</p><p>✓ صلاحية الحساب: {role === "admin" ? "مدير" : "محرر"}</p><p>✓ التطبيق والموقع يقرآن نفس المحتوى</p></div></section>
        <section className="panel"><div className="section-title"><h2>آخر المحتوى</h2><button onClick={() => setTab("content")}>إدارة المحتوى</button></div>{items.slice(0,5).map(x => <div className="content-row" key={x.id}><div><strong>{x.title}</strong><small>{x.published ? "منشور" : "مسودة"} {x.featured ? " · مميز" : ""}</small></div><button onClick={() => editItem(x)}>تعديل</button></div>)}</section>
      </section>}

      {tab === "content" && <section className="dashboard-grid">
        <section className="panel"><div className="section-title"><h2>{editing ? "تعديل المحتوى" : "إضافة محتوى"}</h2>{editing && <button onClick={resetItem}>إلغاء</button>}</div>
          <form className="editor-form" onSubmit={saveItem}>
            <div className="form-grid"><label>النوع<select value={itemForm.type} onChange={e => setItemForm({...itemForm,type:e.target.value as ItemType})}><option value="article">مقال</option><option value="product">منتج</option><option value="page">صفحة</option></select></label>
            <label>التصنيف<select value={itemForm.category_id} onChange={e => setItemForm({...itemForm,category_id:e.target.value})}><option value="">بدون تصنيف</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>العنوان<input required value={itemForm.title} onChange={e => setItemForm({...itemForm,title:e.target.value})}/></label>
            <label>Slug<input required value={itemForm.slug} onChange={e => setItemForm({...itemForm,slug:e.target.value})}/></label>
            <label>رابط الصورة<input value={itemForm.image_url} onChange={e => setItemForm({...itemForm,image_url:e.target.value})}/></label></div>
            <label>المقتطف<textarea rows={3} value={itemForm.excerpt} onChange={e => setItemForm({...itemForm,excerpt:e.target.value})}/></label>
            <label>المحتوى<textarea rows={10} value={itemForm.body} onChange={e => setItemForm({...itemForm,body:e.target.value})}/></label>
            <div className="checks"><label className="checkbox"><input type="checkbox" checked={itemForm.published} onChange={e => setItemForm({...itemForm,published:e.target.checked})}/> منشور</label><label className="checkbox"><input type="checkbox" checked={itemForm.featured} onChange={e => setItemForm({...itemForm,featured:e.target.checked})}/> مميز</label></div>
            <button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : editing ? "حفظ التعديلات" : "إضافة المحتوى"}</button>{message && <p className="message" role="status">{message}</p>}
          </form>
        </section>
        <section className="panel"><div className="section-title"><h2>قائمة المحتوى</h2><button onClick={load}>تحديث</button></div><input className="search" placeholder="بحث بالعنوان أو Slug…" value={search} onChange={e => setSearch(e.target.value)}/><div className="content-list">{filtered.map(x => <article key={x.id}><div><strong>{x.title}</strong><small>{x.type} · {x.published ? "منشور" : "مسودة"}{x.featured ? " · مميز" : ""}</small></div><div className="actions"><a href={x.published ? BASE + "/content/?slug=" + encodeURIComponent(x.slug) : "#"}>عرض</a><button onClick={() => editItem(x)}>تعديل</button><button onClick={() => removeItem(x.id)}>حذف</button></div></article>)}</div></section>
      </section>}

      {tab === "categories" && <section className="dashboard-grid">
        <section className="panel"><h2>{editingCategory ? "تعديل التصنيف" : "إضافة تصنيف"}</h2><form className="editor-form" onSubmit={saveCategory}><label>الاسم<input required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm,name:e.target.value})}/></label><label>Slug<input required value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm,slug:e.target.value})}/></label><label>الوصف<textarea rows={4} value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm,description:e.target.value})}/></label><button className="primary" disabled={saving}>{editingCategory ? "حفظ" : "إضافة"}</button></form></section>
        <section className="panel"><h2>التصنيفات</h2><div className="content-list">{categories.map(c => <article key={c.id}><div><strong>{c.name}</strong><small>/{c.slug}</small></div><div className="actions"><button onClick={() => {setEditingCategory(c.id);setCategoryForm({name:c.name,slug:c.slug,description:c.description??""})}}>تعديل</button><button onClick={() => removeCategory(c.id)}>حذف</button></div></article>)}</div></section>
      </section>}

      {tab === "settings" && role === "admin" && settings && <section className="panel"><h2>إعدادات المنصة</h2><form className="editor-form" onSubmit={saveSettings}><label>اسم المنصة<input value={settings.site_name} onChange={e => setSettings({...settings,site_name:e.target.value})}/></label><label>وصف المنصة<textarea rows={3} value={settings.site_description} onChange={e => setSettings({...settings,site_description:e.target.value})}/></label><label>رابط الشعار<input value={settings.logo_url ?? ""} onChange={e => setSettings({...settings,logo_url:e.target.value})}/></label><label>البريد<input type="email" value={settings.contact_email ?? ""} onChange={e => setSettings({...settings,contact_email:e.target.value})}/></label><label>اللون الرئيسي<input value={settings.primary_color} onChange={e => setSettings({...settings,primary_color:e.target.value})}/></label><label className="checkbox"><input type="checkbox" checked={settings.maintenance_mode} onChange={e => setSettings({...settings,maintenance_mode:e.target.checked})}/> وضع الصيانة</label><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button>{message && <p className="message" role="status">{message}</p>}</form></section>}
    </>}
  </main>;
}
