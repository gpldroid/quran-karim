import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://gpldroid.github.io/wow/"),
  title: "قراءة و الإستماع للقران الكريم",
  description: "قراءة و الاستماع للقرآن الكريم مع توفير شرح الأحاديث النبوية و تفسير الآيات القرآنية على صفحة عماد الدين لمراني للقرآن الكريم",
  keywords: ["القرآن الكريم","قراءة القرآن","الاستماع للقرآن","تلاوة القرآن","تفسير القرآن","الأحاديث النبوية","المصحف الشريف","عماد الدين لمراني"],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    title: "قراءة و الإستماع للقران الكريم",
    description: "قراءة و الاستماع للقرآن الكريم مع توفير شرح الأحاديث النبوية و تفسير الآيات القرآنية على صفحة عماد الدين لمراني للقرآن الكريم",
    url: "https://gpldroid.github.io/wow/"
  }
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
