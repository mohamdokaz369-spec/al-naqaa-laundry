import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "مغسلة النقاء | Al Naqaa Laundry",
  description: "خدمات غسيل ملابس وتنظيف جاف واحترافي في عرابة - مغسلة النقاء",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen font-[family-name:var(--font-cairo)] antialiased">
        {children}
      </body>
    </html>
  );
}
