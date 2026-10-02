const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";

export const metadata = {
  title: "الاستماع إلى القرآن الكريم | WOW",
  description: "الاستماع إلى سور القرآن الكريم مع اختيار القارئ والتشغيل التلقائي.",
};

export default function ListenPage() {
  return (
    <main className="wow-quran-shell">
      <div className="wow-quran-topbar">
        <a href={BASE + "/"} className="wow-quran-back">← العودة إلى WOW</a>
        <span>WOW · الاستماع إلى القرآن الكريم</span>
        <a href={BASE + "/quran/"} className="wow-quran-back">القراءة ←</a>
      </div>
      <iframe
        className="wow-quran-frame"
        src={BASE + "/quran-listen.html"}
        title="الاستماع إلى القرآن الكريم"
        loading="eager"
        allow="autoplay; fullscreen"
      />
      <noscript>يرجى تفعيل JavaScript لاستخدام الاستماع إلى القرآن الكريم.</noscript>
    </main>
  );
}
