import Link from "next/link";
import QuranPlayer from "../../components/QuranPlayer";

export const metadata = {
  title: "القرآن الكريم | Quran Karim",
  description: "منصة متكاملة لقراءة القرآن الكريم والاستماع إلى التلاوات وتحميل التطبيق.",
};

const featureItems = [
  ["اختيار القارئ", "اختيار القارئ من مشغل القرآن."],
  ["تشغيل مباشر", "الاستماع إلى التلاوات المتاحة مباشرة."],
  ["السور المتاحة", "تصفح السور والآيات مع البحث والاختيار السريع."],
  ["مشغل متجاوب", "واجهة تعمل على الهاتف والكمبيوتر."],
];

export default function Home() {
  return (
    <main dir="rtl" className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-black">
            القرآن <span className="text-emerald-400">الكريم</span>
          </Link>
          <nav className="hidden gap-2 md:flex">
            <a href="#quran" className="rounded-xl px-3 py-2 hover:bg-zinc-900">المصحف</a>
            <a href="#readers" className="rounded-xl px-3 py-2 hover:bg-zinc-900">القراء</a>
            <a href="#features" className="rounded-xl px-3 py-2 hover:bg-zinc-900">المزايا</a>
            <Link href="/download" className="rounded-xl px-3 py-2 hover:bg-zinc-900">التطبيق</Link>
            <Link href="/admin/login" className="rounded-xl border border-zinc-700 px-3 py-2">الإدارة</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col justify-center">
          <p className="font-semibold text-emerald-400">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ</p>
          <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">
            القرآن الكريم
            <br />
            <span className="text-emerald-400">قراءةً واستماعاً.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            مصحف إلكتروني عربي مع البحث في السور، اختيار القارئ، الاستماع إلى التلاوات، وصفحة مخصصة لتحميل التطبيق.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#quran" className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-black">ابدأ القراءة</a>
            <Link href="/download" className="rounded-2xl border border-zinc-700 px-6 py-3">تحميل التطبيق</Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-emerald-900/50 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <p className="font-serif text-4xl leading-[2.4]">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</p>
            <p className="mt-4 text-sm text-zinc-500">اقرأ واستمع من مكان واحد</p>
          </div>
        </div>
      </section>

      <section id="quran" className="mx-auto max-w-7xl px-5 py-12">
        <p className="text-sm text-emerald-400">المصحف</p>
        <h2 className="mb-6 text-3xl font-black">قراءة القرآن والاستماع إلى التلاوة</h2>
        <QuranPlayer />
      </section>

      <section id="readers" className="border-y border-zinc-900 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <h2 className="text-3xl font-black">القراء والتلاوات</h2>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            اختر القارئ من مشغل القرآن واستمع إلى السور المتاحة له.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureItems.map(([title, description], index) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-2xl text-emerald-400">{String(index + 1).padStart(2, "0")}</div>
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-2 text-sm text-zinc-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hadith" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-400">السنة النبوية</p>
            <h2 className="text-3xl font-black">الأحاديث</h2>
          </div>
          <Link href="/hadith" className="text-emerald-400">فتح صفحة الأحاديث ←</Link>
        </div>
        <p className="max-w-2xl leading-7 text-zinc-400">
          قسم مستقل للأحاديث النبوية، مع اختيار الكتاب وتحديث البيانات من خلال طبقة Supabase Edge Function.
        </p>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="text-3xl font-black">مزايا الموقع والتطبيق</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-xl font-bold">مصحف إلكتروني</h3>
            <p className="mt-3 text-zinc-400">تصفح السور والآيات مع البحث عن السورة واختيارها بسرعة.</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-xl font-bold">تلاوات إسلام واي</h3>
            <p className="mt-3 text-zinc-400">بيانات القراء والتلاوات تمر عبر طبقة Islamway الموجودة في المشروع.</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-xl font-bold">تطبيق Android</h3>
            <p className="mt-3 text-zinc-400">صفحة التحميل تعرض أحدث إصدار منشور.</p>
            <Link href="/download" className="mt-4 inline-block text-emerald-400">انتقل إلى التحميل ←</Link>
          </article>
        </div>
      </section>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl justify-between px-5 py-8 text-sm text-zinc-500">
          <span>Quran Karim</span>
          <span>موقع القرآن الكريم</span>
        </div>
      </footer>
    </main>
  );
}
