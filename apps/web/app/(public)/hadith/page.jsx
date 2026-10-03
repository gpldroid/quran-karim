import Link from "next/link";
import HadithExplorer from "../../../components/HadithExplorer";

export const metadata = {
  title: "الأحاديث النبوية | القرآن الكريم",
  description: "تصفح الأحاديث النبوية من كتب الحديث المتاحة.",
};

export default function HadithPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-emerald-400">← العودة إلى القرآن الكريم</Link>
        <div className="my-8">
          <HadithExplorer />
        </div>
      </div>
    </main>
  );
}
