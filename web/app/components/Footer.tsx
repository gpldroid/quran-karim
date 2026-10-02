"use client";

import { useEffect, useState } from "react";
import { Github, Globe, Mail } from "lucide-react";

type Locale = "ar" | "en" | "fr";
const footerData = {
  ar: { brand:"عماد الدين لمراني للقرآن الكريم", description:"منصة لقراءة القرآن الكريم والاستماع إلى التلاوات، مع محتوى إسلامي مساعد للقراءة والتدبر.", important:"روابط مهمة", home:"الرئيسية", about:"من نحن", contact:"اتصل بنا", legal:"الصفحات القانونية", privacy:"سياسة الخصوصية", terms:"الشروط والأحكام", cookies:"سياسة ملفات تعريف الارتباط", connect:"تواصل معنا", copyright:"© 2026 عماد الدين لمراني" },
  en: { brand:"Imad Eddine Lmrani Quran", description:"A platform for reading the Quran and listening to recitations, with helpful Islamic content for reflection and learning.", important:"Important links", home:"Home", about:"About", contact:"Contact", legal:"Legal pages", privacy:"Privacy policy", terms:"Terms & conditions", cookies:"Cookie policy", connect:"Contact us", copyright:"© 2026 Imad Eddine Lmrani" },
  fr: { brand:"Imad Eddine Lmrani — Coran", description:"Une plateforme pour lire le Coran et écouter les récitations, avec du contenu islamique utile à la lecture et à la réflexion.", important:"Liens utiles", home:"Accueil", about:"À propos", contact:"Contact", legal:"Pages légales", privacy:"Politique de confidentialité", terms:"Conditions d’utilisation", cookies:"Politique des cookies", connect:"Nous contacter", copyright:"© 2026 Imad Eddine Lmrani" },
} as const;

export default function Footer() {
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
  const t = footerData[locale];
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <section><h2 className="footer-brand">{t.brand}</h2><p>{t.description}</p></section>
      <section><h3>{t.important}</h3><ul><li><a href="/">{t.home}</a></li><li><a href="/about.html">{t.about}</a></li><li><a href="/contact.html">{t.contact}</a></li></ul></section>
      <section><h3>{t.legal}</h3><ul><li><a href="/privacy.html">{t.privacy}</a></li><li><a href="/terms.html">{t.terms}</a></li><li><a href="/cookies.html">{t.cookies}</a></li></ul></section>
      <section className="footer-social"><h3>{t.connect}</h3><div className="social-links" aria-label={t.connect}>
        <a href="/contact.html" aria-label={t.contact} title={t.contact}><Mail size={18}/></a>
        <a href="https://github.com/gpldroid/wow" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub"><Github size={18}/></a>
        <a href="/about.html" aria-label={t.about} title={t.about}><Globe size={18}/></a>
      </div></section>
    </div>
    <div className="copyright">{t.copyright}</div>
  </footer>;
}
