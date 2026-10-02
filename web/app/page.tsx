"use client";

import { useEffect, useState } from "react";
import { BookOpen, Headphones, BookMarked, MoonStar, Clock3, Compass, CalendarDays, Target, Sparkles, LibraryBig, MessageCircleHeart, HeartHandshake, ArrowRight, Languages, Menu, X } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";
type Locale = "ar" | "en" | "fr";
const data = {
  ar: {
    dir:"rtl", language:"اللغة", home:"الرئيسية", quran:"القرآن الكريم", login:"دخول المستخدمين",
    eyebrow:"رفيقك الرقمي للمعرفة والعبادة", title:"كل ما تحتاجه لرحلتك الإيمانية،", accent:"في مكان واحد.",
    intro:"منصة إسلامية تجمع القرآن الكريم والتلاوات والأذكار والخدمات اليومية، بتجربة بسيطة ومتاحة على جميع أجهزتك.",
    explore:"اكتشف الخدمات", open:"افتح المصحف", daily:"مساحتك اليومية", services:"خدمات WOW",
    hint:"اختر ما تريد، وسنرافقك بتجربة واضحة وسهلة.", available:"متاح الآن", soon:"قريباً",
    assistant:"مساعد المعرفة الدينية", assistantText:"مساعد حواري متعدد اللغات، يستند إلى مصادر موثوقة ويحترم الإطار الديني الذي يختاره المستخدم.",
    assistantNote:"اللغة والإطار الديني يحددهما المستخدم، ولا نفترضهما من تلقاء أنفسنا.", assistantSoon:"قريباً ضمن WOW V2",
    footer:"منصة رقمية للمعرفة والعبادة — تُبنى بعناية لتكون أقرب إليك.",
    cards:[["القرآن الكريم","المصحف والقراءة والبحث"],["الاستماع","القراء والتلاوات والإذاعات"],["التفسير","تفسير الآيات ومعانيها"],["الحديث النبوي","الأحاديث والتخريج والشرح"],["الأذكار","أذكار الصباح والمساء والنوم"],["مواقيت الصلاة","المواقيت حسب الموقع"],["القبلة","تحديد اتجاه القبلة"],["التقويم الهجري","التاريخ والمناسبات"],["خطة ختم القرآن","متابعة القراءة والإنجاز"],["أسماء الله الحسنى","الأسماء والمعاني"],["المكتبة الإسلامية","كتب ومحاضرات ومقالات"],["المساعد الديني","إجابات تراعي اللغة والإطار المختار"]]
  },
  en: {
    dir:"ltr", language:"Language", home:"Home", quran:"The Quran", login:"Sign in",
    eyebrow:"Your digital companion for faith and learning", title:"Everything for your spiritual journey,", accent:"in one place.",
    intro:"A welcoming Islamic platform for Quran reading, recitations, remembrance and everyday services — designed for all your devices.",
    explore:"Explore services", open:"Open the Quran", daily:"Your daily space", services:"WOW services",
    hint:"Choose what you need and enjoy a clear, simple experience.", available:"Available now", soon:"Coming soon",
    assistant:"Faith & knowledge assistant", assistantText:"A multilingual assistant grounded in trusted sources and respectful of the religious tradition selected by each user.",
    assistantNote:"Language and religious framework are chosen by the user, never guessed.", assistantSoon:"Coming soon to WOW V2",
    footer:"A digital space for learning and worship — thoughtfully built around you.",
    cards:[["The Quran","Read, explore and search"],["Listen","Reciters, recitations and radio"],["Tafsir","Verse explanations and meanings"],["Hadith","Hadith, references and explanations"],["Dhikr","Morning, evening and bedtime adhkar"],["Prayer times","Prayer times for your location"],["Qibla","Find the direction of prayer"],["Hijri calendar","Dates and Islamic occasions"],["Quran journey","Track your reading and progress"],["Names of Allah","The names and their meanings"],["Islamic library","Books, lectures and articles"],["Faith assistant","Answers in your language and chosen tradition"]]
  },
  fr: {
    dir:"ltr", language:"Langue", home:"Accueil", quran:"Le Coran", login:"Connexion",
    eyebrow:"Votre compagnon numérique pour apprendre et pratiquer", title:"Tout pour votre cheminement spirituel,", accent:"au même endroit.",
    intro:"Une plateforme islamique qui réunit lecture du Coran, récitations, invocations et services du quotidien, sur tous vos appareils.",
    explore:"Découvrir les services", open:"Ouvrir le Coran", daily:"Votre espace quotidien", services:"Les services WOW",
    hint:"Choisissez votre service et profitez d’une expérience simple et claire.", available:"Disponible", soon:"Bientôt",
    assistant:"Assistant de connaissance religieuse", assistantText:"Un assistant multilingue fondé sur des sources fiables et respectueux de la tradition choisie par l’utilisateur.",
    assistantNote:"La langue et le cadre religieux sont choisis par l’utilisateur, jamais supposés.", assistantSoon:"Bientôt dans WOW V2",
    footer:"Un espace numérique de connaissance et de spiritualité, conçu avec attention.",
    cards:[["Le Coran","Lecture, consultation et recherche"],["Écouter","Récitateurs, récitations et radios"],["Tafsir","Explication des versets"],["Hadith","Hadiths, références et explications"],["Invocations","Invocations du matin, du soir et du coucher"],["Horaires de prière","Horaires selon votre position"],["Qibla","Trouver la direction de la prière"],["Calendrier hégirien","Dates et événements islamiques"],["Parcours coranique","Suivre votre lecture et vos progrès"],["Noms d’Allah","Les noms et leurs significations"],["Bibliothèque islamique","Livres, conférences et articles"],["Assistant religieux","Réponses dans votre langue et tradition choisie"]]
  }
} as const;
const icons = [BookOpen,Headphones,BookMarked,MoonStar,HeartHandshake,Clock3,Compass,CalendarDays,Target,Sparkles,LibraryBig,MessageCircleHeart];
const active = new Set([0,1,2]);

export default function Home() {
  const [locale,setLocale] = useState<Locale>("ar");
  const [menu,setMenu] = useState(false);
  const t = data[locale];
  useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=t.dir;},[locale,t.dir]);
  return <main className="wow-home" dir={t.dir}>
    <header className="wow-header">
      <a className="wow-brand" href={BASE+"/"}><span className="wow-brand-mark"><MoonStar size={23}/></span><span>WOW<span className="wow-brand-dot">.</span><small>FAITH · KNOWLEDGE · DAILY LIFE</small></span></a>
      <button className="wow-menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation">{menu?<X/>:<Menu/>}</button>
      <nav className={menu?"wow-nav is-open":"wow-nav"}><a href={BASE+"/"}>{t.home}</a><a href={BASE+"/quran/"}>{t.quran}</a><a href="#services">{t.explore}</a><a className="wow-login" href={BASE+"/login/"}>{t.login}</a></nav>
      <div className="wow-language" aria-label={t.language}><Languages size={17}/>{(["ar","en","fr"] as Locale[]).map(v=><button key={v} onClick={()=>{setLocale(v);setMenu(false);}} className={locale===v?"selected":""} aria-pressed={locale===v}>{v.toUpperCase()}</button>)}</div>
    </header>
    <section className="wow-hero">
      <div className="wow-hero-copy"><span className="wow-eyebrow"><span/>{t.eyebrow}</span><h1>{t.title}<em>{t.accent}</em></h1><p>{t.intro}</p>
        <div className="wow-hero-actions"><a className="wow-primary-button" href="#services">{t.explore}<ArrowRight size={18}/></a><a className="wow-secondary-button" href={BASE+"/quran/"}><BookOpen size={18}/>{t.open}</a></div>
        <div className="wow-hero-foot"><span className="wow-foot-line"/>QURAN · REFLECTION · COMMUNITY</div>
      </div>
      <div className="wow-hero-art" aria-hidden="true"><div className="wow-orbit wow-orbit-one"/><div className="wow-orbit wow-orbit-two"/><div className="wow-art-glow"/><div className="wow-book-card"><div className="wow-book-top">القرآن الكريم</div><div className="wow-book-arabic">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</div><div className="wow-book-rule"/><div className="wow-book-caption">سورة المزمل · ٤</div><div className="wow-book-seal"><BookOpen size={25}/></div></div><span className="wow-floating wow-float-one"><MoonStar size={18}/></span><span className="wow-floating wow-float-two"><Sparkles size={17}/></span></div>
      <div className="wow-hero-bottom"><span>01 / 03</span><span className="wow-hero-bottom-rule"/><span>MADE FOR EVERY DAY</span></div>
    </section>
    <section className="wow-services" id="services"><div className="wow-section-heading"><div><span className="wow-section-kicker">{t.daily}</span><h2>{t.services}</h2></div><p>{t.hint}</p></div>
      <div className="wow-service-grid">{t.cards.map((card,i)=>{const Icon=icons[i];const body=<><span className="wow-service-icon"><Icon size={23} strokeWidth={1.7}/></span><span className="wow-service-status">{active.has(i)?t.available:t.soon}</span><h3>{card[0]}</h3><p>{card[1]}</p></>;return active.has(i)?<a className="wow-service-card is-active" href={BASE+"/quran/"} key={card[0]}>{body}</a>:<article className="wow-service-card is-coming" key={card[0]} aria-label={card[0]+" — "+t.soon}>{body}</article>;})}</div>
    </section>
    <section className="wow-assistant"><div className="wow-assistant-icon"><MessageCircleHeart size={30}/></div><div className="wow-assistant-copy"><span className="wow-section-kicker">WOW AI · MULTILINGUAL</span><h2>{t.assistant}</h2><p>{t.assistantText}</p><small>{t.assistantNote}</small></div><span className="wow-assistant-pill"><Sparkles size={15}/>{t.assistantSoon}</span></section>
    <footer className="wow-footer"><a className="wow-footer-brand" href={BASE+"/"}>WOW<span>.</span></a><p>{t.footer}</p><a href={BASE+"/login/"}>{t.login}</a></footer>
  </main>;
}
