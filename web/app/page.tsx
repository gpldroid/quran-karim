"use client";

import { useEffect, useState } from "react";
import { BookOpen, Headphones, BookMarked, MoonStar, Clock3, Compass, CalendarDays, Target, Sparkles, LibraryBig, MessageCircleHeart, HeartHandshake, ArrowRight } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";
type Locale = "ar" | "en" | "fr";
const data = {
  ar: {
    dir:"rtl", language:"اللغة", home:"الرئيسية", quran:"القرآن الكريم",
    eyebrow:"رفيقك الرقمي للمعرفة والعبادة", title:"كل ما تحتاجه لرحلتك الإيمانية،", accent:"في مكان واحد.",
    intro:"منصة إسلامية تجمع القرآن الكريم والتلاوات والأذكار والخدمات اليومية، بتجربة بسيطة ومتاحة على جميع أجهزتك.",
    explore:"اكتشف الخدمات", open:"افتح المصحف", daily:"مساحتك اليومية", services:"خدمات WOW",
    hint:"اختر ما تريد، وسنرافقك بتجربة واضحة وسهلة.", available:"متاح الآن", soon:"قريباً",
    assistant:"مساعد البحث الديني", assistantText:"بحث متعدد اللغات في النص القرآني يعرض الآيات ومراجعها من مصدر مفتوح.",
    assistantNote:"لا يصدر فتاوى أو إجابات مولدة؛ سيضاف الذكاء الاصطناعي التوليدي بعد تجهيز خادم آمن.", assistantSoon:"بحث موثق متاح",
    footer:"منصة رقمية للمعرفة والعبادة — تُبنى بعناية لتكون أقرب إليك.",
    cards:[["القرآن الكريم","المصحف والقراءة والبحث"],["الاستماع","القراء والتلاوات والإذاعات"],["التفسير","تفسير الآيات ومعانيها"],["الحديث النبوي","الأحاديث والتخريج والشرح"],["الأذكار","أذكار الصباح والمساء والنوم"],["مواقيت الصلاة","المواقيت حسب الموقع"],["القبلة","تحديد اتجاه القبلة"],["التقويم الهجري","التاريخ والمناسبات"],["خطة ختم القرآن","متابعة القراءة والإنجاز"],["أسماء الله الحسنى","الأسماء والمعاني"],["المكتبة الإسلامية","كتب ومحاضرات ومقالات"],["مساعد البحث الديني","بحث في النص القرآني مع المراجع"]]
  },
  en: {
    dir:"ltr", language:"Language", home:"Home", quran:"The Quran",
    eyebrow:"Your digital companion for faith and learning", title:"Everything for your spiritual journey,", accent:"in one place.",
    intro:"A welcoming Islamic platform for Quran reading, recitations, remembrance and everyday services — designed for all your devices.",
    explore:"Explore services", open:"Open the Quran", daily:"Your daily space", services:"WOW services",
    hint:"Choose what you need and enjoy a clear, simple experience.", available:"Available now", soon:"Coming soon",
    assistant:"Faith & knowledge search", assistantText:"Multilingual search across Quranic text, showing matching verses and source references.",
    assistantNote:"It does not generate fatwas or AI answers; generative AI may be added through a secure backend later.", assistantSoon:"Source search available",
    footer:"A digital space for learning and worship — thoughtfully built around you.",
    cards:[["The Quran","Read, explore and search"],["Listen","Reciters, recitations and radio"],["Tafsir","Verse explanations and meanings"],["Hadith","Hadith, references and explanations"],["Dhikr","Morning, evening and bedtime adhkar"],["Prayer times","Prayer times for your location"],["Qibla","Find the direction of prayer"],["Hijri calendar","Dates and Islamic occasions"],["Quran journey","Track your reading and progress"],["Names of Allah","The names and their meanings"],["Islamic library","Books, lectures and articles"],["Faith search","Quranic text search with references"]]
  },
  fr: {
    dir:"ltr", language:"Langue", home:"Accueil", quran:"Le Coran",
    eyebrow:"Votre compagnon numérique pour apprendre et pratiquer", title:"Tout pour votre cheminement spirituel,", accent:"au même endroit.",
    intro:"Une plateforme islamique qui réunit lecture du Coran, récitations, invocations et services du quotidien, sur tous vos appareils.",
    explore:"Découvrir les services", open:"Ouvrir le Coran", daily:"Votre espace quotidien", services:"Les services WOW",
    hint:"Choisissez votre service et profitez d’une expérience simple et claire.", available:"Disponible", soon:"Bientôt",
    assistant:"Recherche religieuse", assistantText:"Recherche multilingue dans le texte coranique avec versets correspondants et références.",
    assistantNote:"Aucune fatwa ni réponse générée automatiquement ; une IA générative nécessitera un serveur sécurisé.", assistantSoon:"Recherche sourcée disponible",
    footer:"Un espace numérique de connaissance et de spiritualité, conçu avec attention.",
    cards:[["Le Coran","Lecture, consultation et recherche"],["Écouter","Récitateurs, récitations et radios"],["Tafsir","Explication des versets"],["Hadith","Hadiths, références et explications"],["Invocations","Invocations du matin, du soir et du coucher"],["Horaires de prière","Horaires selon votre position"],["Qibla","Trouver la direction de la prière"],["Calendrier hégirien","Dates et événements islamiques"],["Parcours coranique","Suivre votre lecture et vos progrès"],["Noms d’Allah","Les noms et leurs significations"],["Bibliothèque islamique","Livres, conférences et articles"],["Recherche religieuse","Recherche coranique avec références"]]
  }
} as const;
const icons = [BookOpen,Headphones,BookMarked,MoonStar,HeartHandshake,Clock3,Compass,CalendarDays,Target,Sparkles,LibraryBig,MessageCircleHeart];
const active = new Set([0,1,2,3,4,5,6,7,8,9,10,11]);
const routes = ["/quran/","/listen/","/tafsir/","/hadith/","/azkar/","/prayer/","/qibla/","/hijri/","/khatma/","/names/","/library/","/assistant/"];

export default function Home() {
  const [locale,setLocale] = useState<Locale>("ar");
  const [menu,setMenu] = useState(false);
  const t = data[locale];
  useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=t.dir;},[locale,t.dir]);
  return <main className="wow-home" dir={t.dir}>
    <section className="wow-hero">
      <div className="wow-hero-copy"><span className="wow-eyebrow"><span/>{t.eyebrow}</span><h1>{t.title}<em>{t.accent}</em></h1><p>{t.intro}</p>
        <div className="wow-hero-actions"><a className="wow-primary-button" href="#services">{t.explore}<ArrowRight size={18}/></a><a className="wow-secondary-button" href={BASE+"/quran/"}><BookOpen size={18}/>{t.open}</a></div>
        <div className="wow-hero-foot"><span className="wow-foot-line"/>QURAN · REFLECTION · COMMUNITY</div>
      </div>
      <div className="wow-hero-art" aria-hidden="true"><div className="wow-orbit wow-orbit-one"/><div className="wow-orbit wow-orbit-two"/><div className="wow-art-glow"/><div className="wow-book-card"><div className="wow-book-top">القرآن الكريم</div><div className="wow-book-arabic">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</div><div className="wow-book-rule"/><div className="wow-book-caption">سورة المزمل · ٤</div><div className="wow-book-seal"><BookOpen size={25}/></div></div><span className="wow-floating wow-float-one"><MoonStar size={18}/></span><span className="wow-floating wow-float-two"><Sparkles size={17}/></span></div>
      <div className="wow-hero-bottom"><span>01 / 03</span><span className="wow-hero-bottom-rule"/><span>MADE FOR EVERY DAY</span></div>
    </section>
    <section className="wow-services" id="services"><div className="wow-section-heading"><div><span className="wow-section-kicker">{t.daily}</span><h2>{t.services}</h2></div><p>{t.hint}</p></div>
      <div className="wow-service-grid">{t.cards.map((card,i)=>{const Icon=icons[i];const body=<><span className="wow-service-icon"><Icon size={23} strokeWidth={1.7}/></span><span className="wow-service-status">{active.has(i)?t.available:t.soon}</span><h3>{card[0]}</h3><p>{card[1]}</p></>;return active.has(i)?<a className="wow-service-card is-active" href={BASE+routes[i]} key={card[0]}>{body}</a>:<article className="wow-service-card is-coming" key={card[0]} aria-label={card[0]+" — "+t.soon}>{body}</article>;})}</div>
    </section>
    <section className="wow-assistant"><div className="wow-assistant-icon"><MessageCircleHeart size={30}/></div><div className="wow-assistant-copy"><span className="wow-section-kicker">SOURCE SEARCH · MULTILINGUAL</span><h2>{t.assistant}</h2><p>{t.assistantText}</p><small>{t.assistantNote}</small></div><span className="wow-assistant-pill"><Sparkles size={15}/>{t.assistantSoon}</span></section>
  </main>;
}
