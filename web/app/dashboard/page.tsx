"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";

type Role = "admin" | "editor";
type AdPlacement = "header" | "body_top" | "body_bottom" | "interstitial";
type AdPlatform = "web" | "android" | "both";
type Ad = { id: string; placement: AdPlacement; ad_code: string; is_active: boolean; target_platform: AdPlatform };
type SeoPage = { id: string; slug: string; title: string; content: string; meta_title: string | null; meta_description: string | null; meta_keywords: string | null; is_published: boolean };
type ThemeConfig = { primary: string; secondary: string; background: string; surface: string; font: string; radius: string };

type ItemType = "article" | "product" | "page";
type Category = { id: string; name: string; slug: string; description: string | null };
type Item = { id: string; type: ItemType; title: string; slug: string; excerpt: string | null; body: string | null; image_url: string | null; published: boolean; featured: boolean; category_id: string | null };
type Settings = { id: boolean; site_name: string; site_description: string; logo_url: string | null; primary_color: string; maintenance_mode: boolean; contact_email: string | null; google_analytics_id: string | null; theme_config: ThemeConfig };

const emptyItem = { type: "article" as ItemType, title: "", slug: "", excerpt: "", body: "", image_url: "", published: false, featured: false, category_id: "" };
const emptyCategory = { name: "", slug: "", description: "" };
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";
const defaultTheme: ThemeConfig = { primary: "#16a34a", secondary: "#2563eb", background: "#f8fafc", surface: "#ffffff", font: "Tajawal", radius: "16px" };
const emptyAd: Omit<Ad, "id"> = { placement: "header", ad_code: "", is_active: true, target_platform: "both" };
const emptySeo: Omit<SeoPage, "id"> = { slug: "", title: "", content: "", meta_title: "", meta_description: "", meta_keywords: "", is_published: false };

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
  const [ads, setAds] = useState<Ad[]>([]);
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [adForm, setAdForm] = useState(emptyAd);
  const [seoForm, setSeoForm] = useState(emptySeo);
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [editingSeo, setEditingSeo] = useState<string | null>(null);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const [{ data: userData }, { data: profile }, { data: content }, { data: cats }, { data: adsData }, { data: seoData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("role").single(),
      supabase.from("content_items").select("id,type,title,slug,excerpt,body,image_url,published,featured,category_id").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name,slug,description").order("name"),
      supabase.from("ads_management").select("id,placement,ad_code,is_active,target_platform").order("placement"),
      supabase.from("pages_and_seo").select("id,slug,title,content,meta_title,meta_description,meta_keywords,is_published").order("updated_at", { ascending: false })
    ]);
    setEmail(userData.user?.email ?? "");
    setRole((profile?.role as Role) ?? null);
    setItems(content ?? []);
    setCategories(cats ?? []);
    setAds((adsData ?? []) as Ad[]);
    setSeoPages((seoData ?? []) as SeoPage[]);
    if (profile?.role === "admin") {
      const { data } = await supabase.from("app_settings").select("*").eq("id", true).single();
      if (data) setSettings({ ...data, theme_config: { ...defaultTheme, ...(data.theme_config ?? {}) } });
    }
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getUser().then(({ data }) => {
      if (mounted && !data.user) window.location.href = BASE + "/login/";
    });
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("dashboard-content-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_items" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "ads_management" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "pages_and_seo" }, () => load())
      .subscribe();
    return () => { if (supabase) supabase.removeChannel(channel); };
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

  async function saveAd(e: FormEvent) {
    e.preventDefault(); if (!supabase || role !== "admin") return;
    setSaving(true); setMessage("");
    const payload = { placement: adForm.placement, ad_code: adForm.ad_code.trim(), is_active: adForm.is_active, target_platform: adForm.target_platform };
    const result = editingAd ? await supabase.from("ads_management").update(payload).eq("id", editingAd) : await supabase.from("ads_management").insert(payload);
    setMessage(result.error?.message ?? (editingAd ? "تم تحديث الإعلان." : "تمت إضافة الإعلان."));
    if (!result.error) { setAdForm(emptyAd); setEditingAd(null); await load(); }
    setSaving(false);
  }

  async function toggleAd(ad: Ad) {
    if (!supabase || role !== "admin") return;
    const { error } = await supabase.from("ads_management").update({ is_active: !ad.is_active }).eq("id", ad.id);
    setMessage(error?.message ?? (!ad.is_active ? "تم تفعيل الإعلان." : "تم تعطيل الإعلان."));
    if (!error) await load();
  }

  async function removeAd(id: string) {
    if (!supabase || role !== "admin" || !confirm("هل تريد حذف الإعلان؟")) return;
    const { error } = await supabase.from("ads_management").delete().eq("id", id);
    setMessage(error?.message ?? "تم حذف الإعلان.");
    if (!error) await load();
  }

  async function saveSeo(e: FormEvent) {
    e.preventDefault(); if (!supabase || role !== "admin") return;
    setSaving(true); setMessage("");
    const payload = {
      slug: seoForm.slug.trim().replace(/^\/+|\/+$/g, ""),
      title: seoForm.title.trim(),
      content: seoForm.content,
      meta_title: seoForm.meta_title?.trim() || null,
      meta_description: seoForm.meta_description?.trim() || null,
      meta_keywords: seoForm.meta_keywords?.trim() || null,
      is_published: seoForm.is_published
    };
    const result = editingSeo ? await supabase.from("pages_and_seo").update(payload).eq("id", editingSeo) : await supabase.from("pages_and_seo").insert(payload);
    setMessage(result.error?.message ?? (editingSeo ? "تم تحديث صفحة SEO." : "تمت إضافة صفحة SEO."));
    if (!result.error) { setSeoForm(emptySeo); setEditingSeo(null); await load(); }
    setSaving(false);
  }

  async function removeSeo(id: string) {
    if (!supabase || role !== "admin" || !confirm("هل تريد حذف صفحة SEO؟")) return;
    const { error } = await supabase.from("pages_and_seo").delete().eq("id", id);
    setMessage(error?.message ?? "تم حذف صفحة SEO.");
    if (!error) await load();
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault(); if (!supabase || !settings || role !== "admin") return; setSaving(true);
    const { error } = await supabase.from("app_settings").update({
      site_name: settings.site_name,
      site_description: settings.site_description,
      logo_url: settings.logo_url || null,
      primary_color: settings.primary_color,
      maintenance_mode: settings.maintenance_mode,
      contact_email: settings.contact_email || null,
      google_analytics_id: settings.google_analytics_id || null,
      theme_config: settings.theme_config
    }).eq("id", true);
    setMessage(error?.message ?? "تم حفظ إعدادات المنصة."); setSaving(false);
  }

  async function logout() { if (supabase) await supabase.auth.signOut(); location.href = BASE + "/"; }

  const published = items.filter(x => x.published).length;
  const drafts = items.length - published;
  const featured = items.filter(x => x.featured).length;

  return <main className="dashboard" dir="rtl">
    <header className="dashboard-header">
      <div><h1>WOW Dashboard</h1><span>{email || "لوحة الإدارة"} · {role === "admin" ? "مدير" : "محرر"}</span></div>
      <div className="actions"><a href={BASE + "/"}>الموقع</a><button onClick={logout}>تسجيل الخروج</button></div>
    </header>

    <nav className="dashboard-nav" aria-label="أقسام لوحة التحكم">
      {["overview","content","categories",...(role === "admin" ? ["settings","theme","seo","ads"] : [])].map(x => <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x === "overview" ? "نظرة عامة" : x === "content" ? "المحتوى" : x === "categories" ? "التصنيفات" : x === "settings" ? "الإعدادات العامة" : x === "theme" ? "تخصيص المظهر" : x === "seo" ? "الصفحات و SEO" : "الإعلانات"}</button>)}
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

      {tab === "settings" && role === "admin" && settings && <section className="panel"><h2>الإعدادات العامة والتتبع</h2><form className="editor-form" onSubmit={saveSettings}><label>اسم المنصة<input value={settings.site_name} onChange={e => setSettings({...settings,site_name:e.target.value})}/></label><label>وصف المنصة<textarea rows={3} value={settings.site_description} onChange={e => setSettings({...settings,site_description:e.target.value})}/></label><label>رابط الشعار<input value={settings.logo_url ?? ""} onChange={e => setSettings({...settings,logo_url:e.target.value})}/></label><label>البريد<input type="email" value={settings.contact_email ?? ""} onChange={e => setSettings({...settings,contact_email:e.target.value})}/></label><label>Google Analytics ID<input placeholder="G-XXXXXXXXXX" value={settings.google_analytics_id ?? ""} onChange={e => setSettings({...settings,google_analytics_id:e.target.value})}/></label><label>اللون الرئيسي<input value={settings.primary_color} onChange={e => setSettings({...settings,primary_color:e.target.value})}/></label><label className="checkbox"><input type="checkbox" checked={settings.maintenance_mode} onChange={e => setSettings({...settings,maintenance_mode:e.target.checked})}/> وضع الصيانة</label><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button>{message && <p className="message" role="status">{message}</p>}</form></section>}

      {tab === "theme" && role === "admin" && settings && <section className="panel"><h2>تخصيص المظهر</h2><p>احفظ إعدادات الألوان والخطوط في JSONB لتستهلكها واجهة الويب والتطبيق.</p><form className="editor-form" onSubmit={saveSettings}><div className="form-grid"><label>اللون الرئيسي<input type="color" value={settings.theme_config.primary} onChange={e => setSettings({...settings,theme_config:{...settings.theme_config,primary:e.target.value},primary_color:e.target.value})}/></label><label>اللون الثانوي<input type="color" value={settings.theme_config.secondary} onChange={e => setSettings({...settings,theme_config:{...settings.theme_config,secondary:e.target.value}})}/></label><label>الخلفية<input type="color" value={settings.theme_config.background} onChange={e => setSettings({...settings,theme_config:{...settings.theme_config,background:e.target.value}})}/></label><label>سطح البطاقات<input type="color" value={settings.theme_config.surface} onChange={e => setSettings({...settings,theme_config:{...settings.theme_config,surface:e.target.value}})}/></label></div><label>الخط<input value={settings.theme_config.font} onChange={e => setSettings({...settings,theme_config:{...settings.theme_config,font:e.target.value}})}/></label><label>نصف قطر العناصر<input value={settings.theme_config.radius} onChange={e => setSettings({...settings,theme_config:{...settings.theme_config,radius:e.target.value}})}/></label><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ المظهر"}</button>{message && <p className="message" role="status">{message}</p>}</form></section>}

      {tab === "seo" && role === "admin" && <section className="dashboard-grid"><section className="panel"><div className="section-title"><h2>{editingSeo ? "تعديل صفحة SEO" : "إضافة صفحة SEO"}</h2>{editingSeo && <button onClick={() => {setEditingSeo(null);setSeoForm(emptySeo)}}>إلغاء</button>}</div><form className="editor-form" onSubmit={saveSeo}><label>Slug<input required value={seoForm.slug} onChange={e => setSeoForm({...seoForm,slug:e.target.value})}/></label><label>العنوان<input required value={seoForm.title} onChange={e => setSeoForm({...seoForm,title:e.target.value})}/></label><label>المحتوى<textarea rows={12} value={seoForm.content} onChange={e => setSeoForm({...seoForm,content:e.target.value})}/></label><label>Meta Title<input value={seoForm.meta_title ?? ""} onChange={e => setSeoForm({...seoForm,meta_title:e.target.value})}/></label><label>Meta Description<textarea rows={3} value={seoForm.meta_description ?? ""} onChange={e => setSeoForm({...seoForm,meta_description:e.target.value})}/></label><label>Meta Keywords<input value={seoForm.meta_keywords ?? ""} onChange={e => setSeoForm({...seoForm,meta_keywords:e.target.value})}/></label><label className="checkbox"><input type="checkbox" checked={seoForm.is_published} onChange={e => setSeoForm({...seoForm,is_published:e.target.checked})}/> منشورة</label><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : editingSeo ? "حفظ التعديلات" : "إضافة الصفحة"}</button></form></section><section className="panel"><div className="section-title"><h2>الصفحات</h2><button onClick={load}>تحديث</button></div><div className="content-list">{seoPages.map(p => <article key={p.id}><div><strong>{p.title}</strong><small>/{p.slug} · {p.is_published ? "منشورة" : "مسودة"}</small></div><div className="actions"><button onClick={() => {setEditingSeo(p.id);setSeoForm(p);}}>تعديل</button><button onClick={() => removeSeo(p.id)}>حذف</button></div></article>)}</div></section></section>}

      {tab === "ads" && role === "admin" && <section className="dashboard-grid"><section className="panel"><div className="section-title"><h2>{editingAd ? "تعديل الإعلان" : "إضافة إعلان"}</h2>{editingAd && <button onClick={() => {setEditingAd(null);setAdForm(emptyAd)}}>إلغاء</button>}</div><form className="editor-form" onSubmit={saveAd}><label>مكان العرض<select value={adForm.placement} onChange={e => setAdForm({...adForm,placement:e.target.value as AdPlacement})}><option value="header">Header</option><option value="body_top">أعلى المحتوى</option><option value="body_bottom">أسفل المحتوى</option><option value="interstitial">Interstitial</option></select></label><label>المنصة<select value={adForm.target_platform} onChange={e => setAdForm({...adForm,target_platform:e.target.value as AdPlatform})}><option value="web">Web</option><option value="android">Android</option><option value="both">كلاهما</option></select></label><label>AdSense Code / AdMob Unit ID<textarea rows={6} required value={adForm.ad_code} onChange={e => setAdForm({...adForm,ad_code:e.target.value})}/></label><label className="checkbox"><input type="checkbox" checked={adForm.is_active} onChange={e => setAdForm({...adForm,is_active:e.target.checked})}/> مفعّل</label><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : editingAd ? "حفظ الإعلان" : "إضافة الإعلان"}</button></form></section><section className="panel"><div className="section-title"><h2>الإعلانات</h2><button onClick={load}>تحديث</button></div><div className="content-list">{ads.map(ad => <article key={ad.id}><div><strong>{ad.placement}</strong><small>{ad.target_platform} · {ad.is_active ? "مفعّل" : "معطّل"}</small></div><div className="actions"><button onClick={() => toggleAd(ad)}>{ad.is_active ? "تعطيل" : "تفعيل"}</button><button onClick={() => {setEditingAd(ad.id);setAdForm({placement:ad.placement,ad_code:ad.ad_code,is_active:ad.is_active,target_platform:ad.target_platform})}}>تعديل</button><button onClick={() => removeAd(ad.id)}>حذف</button></div></article>)}</div></section></section>}
    </>}
  </main>;
}
