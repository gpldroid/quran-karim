import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WOW",
  description: "Unified web, dashboard and mobile platform."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
