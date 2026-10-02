const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";

export const metadata = {
  title: "القرآن الكريم | WOW",
  description: "افتح المصحف واستمع إلى التلاوات وتابع قراءتك عبر واجهة القرآن الحالية.",
};

export default function QuranPage() {
  return (
    <main className="wow-quran-shell">
      <div className="wow-quran-topbar">
        <a href={BASE + "/"} className="wow-quran-back">← العودة إلى WOW</a>
        <span>WOW · القرآن الكريم</span>
      </div>
      <iframe
        className="wow-quran-frame"
        src={BASE + "/quran.html"}
        title="واجهة القرآن الكريم الحالية"
        loading="eager"
        allow="autoplay; fullscreen"
      />
      <noscript>يرجى تفعيل JavaScript لاستخدام مشغل القرآن الكريم.</noscript>
    </main>
  );
}
