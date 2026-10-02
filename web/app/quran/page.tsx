const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/wow";

export const metadata = {
  title: "قراءة القرآن الكريم | WOW",
  description: "قراءة المصحف كاملة مع أزرار السور، الترجمة والتفسير الميسر، دون مشغل صوتي.",
};

export default function QuranPage() {
  return (
    <main className="wow-quran-shell">
      <div className="wow-quran-topbar">
        <a href={BASE + "/"} className="wow-quran-back">← العودة إلى WOW</a>
        <span>WOW · قراءة القرآن الكريم</span>
        <a href={BASE + "/listen/"} className="wow-quran-back">الاستماع ←</a>
      </div>
      <iframe
        className="wow-quran-frame"
        src={BASE + "/quran-read.html"}
        title="قراءة القرآن الكريم"
        loading="eager"
      />
      <noscript>يرجى تفعيل JavaScript لقراءة القرآن الكريم.</noscript>
    </main>
  );
}
