import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://gpldroid.github.io/wow/"),
  title: { default: "WOW | منصة المعرفة والعبادة", template: "%s | WOW" },
  description: "WOW منصة إسلامية متعددة اللغات تجمع القرآن الكريم والتلاوات والأذكار والخدمات اليومية في تجربة رقمية واحدة.",
  keywords: ["WOW", "القرآن الكريم", "قراءة القرآن", "الاستماع للقرآن", "الأذكار", "مواقيت الصلاة", "التفسير", "الحديث النبوي"],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    title: "WOW | منصة المعرفة والعبادة",
    description: "منصة إسلامية متعددة اللغات للقرآن الكريم والخدمات اليومية.",
    url: "https://gpldroid.github.io/wow/"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl"><body><Header />{children}<Footer /></body></html>;
}
