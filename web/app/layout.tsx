import "./globals.css";
import CookieConsent from "./components/CookieConsent";
import type { Metadata } from "next";

export const metadata: Metadata={metadataBase:new URL("https://gpldroid.github.io/wow/"),title:{default:"قراءة و الإستماع للقران الكريم",template:"%s | قراءة و الإستماع للقران الكريم"},description:"منصة متعددة اللغات لقراءة القرآن الكريم والاستماع إلى التلاوات وخدمات إسلامية يومية.",keywords:["القرآن الكريم","قراءة القرآن","الاستماع للقرآن","الأذكار","مواقيت الصلاة","التفسير","الحديث النبوي"],robots:{index:true,follow:true},alternates:{canonical:"/"},openGraph:{type:"website",locale:"ar_AR",title:"قراءة و الإستماع للقران الكريم",description:"منصة متعددة اللغات لقراءة القرآن الكريم والاستماع إلى التلاوات وخدمات إسلامية يومية.",url:"https://gpldroid.github.io/wow/"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}<CookieConsent/></body></html>}