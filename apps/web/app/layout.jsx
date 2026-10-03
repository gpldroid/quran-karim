import "./globals.css";
import DirectionToggle from "./DirectionToggle";
export const metadata={title:"القرآن الكريم",description:"منصة القرآن الكريم والحديث الشريف"};
export default function RootLayout({children}){return <html lang="ar" dir="rtl"><body><DirectionToggle/>{children}</body></html>}