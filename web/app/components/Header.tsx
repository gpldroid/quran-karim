"use client";

import { useEffect, useState } from "react";
import { Menu, X, Home, CircleInfo, Mail, ShieldCheck, FileText, Cookie } from "lucide-react";

type Locale = "ar" | "en" | "fr";
const localeLabels: Record<Locale, string> = { ar: "AR", en: "EN", fr: "FR" };
const labels = {
  ar: { home:"الرئيسية", about:"من نحن", contact:"اتصل بنا", privacy:"الخصوصية", terms:"الشروط", cookies:"الكوكيز", open:"فتح قائمة التنقل", close:"إغلاق قائمة التنقل" },
  en: { home:"Home", about:"About", contact:"Contact", privacy:"Privacy", terms:"Terms", cookies:"Cookies", open:"Open navigation", close:"Close navigation" },
  fr: { home:"Accueil", about:"À propos", contact:"Contact", privacy:"Confidentialité", terms:"Conditions", cookies:"Cookies", open:"Ouvrir la navigation", close:"Fermer la navigation" },
} as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem("wow-locale") as Locale | null;
    if (saved === "ar" || saved === "en" || saved === "fr") setLocale(saved);
    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<Locale>).detail;
      if (next === "ar" || next === "en" || next === "fr") setLocale(next);
    };
    window.addEventListener("wow-locale-change", onLocaleChange);
    return () => window.removeEventListener("wow-locale-change", onLocaleChange);
  }, []);

  const changeLocale = (next: Locale) => {
    setLocale(next);
    window.localStorage.setItem("wow-locale", next);
    window.dispatchEvent(new CustomEvent("wow-locale-change", { detail: next }));
  };

  const t = labels[locale];
  const links = [
    ["/", t.home, Home], ["/about.html", t.about, CircleInfo], ["/contact.html", t.contact, Mail],
    ["/privacy.html", t.privacy, ShieldCheck], ["/terms.html", t.terms, FileText], ["/cookies.html", t.cookies, Cookie],
  ] as const;

  return <header className="site-header">
    <div className="header-content">
      <a className="logo" href="/">
        <img src="/wow/logo.svg" alt="شعار القرآن الكريم" loading="eager" />
        <h1>قراءة و الإستماع للقران الكريم</h1>
      </a>
      <button className="nav-toggle" type="button" onClick={() => setOpen(!open)}
        aria-label={open ? t.close : t.open} aria-controls="navLinks" aria-expanded={open}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <ul className={open ? "nav-links active" : "nav-links"} id="navLinks">
        {links.map(([href, label, Icon]) => <li key={href}><a href={href} onClick={() => setOpen(false)}><Icon size={16} aria-hidden="true" />{label}</a></li>)}
      </ul>
      <div className="site-language" aria-label="Language">
        {(Object.keys(localeLabels) as Locale[]).map(item =>
          <button key={item} type="button" className={locale === item ? "selected" : ""} onClick={() => changeLocale(item)} aria-pressed={locale === item}>{localeLabels[item]}</button>
        )}
      </div>
    </div>
  </header>;
}
