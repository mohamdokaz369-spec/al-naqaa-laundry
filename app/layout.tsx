import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مغسلة النقاء | Al Naqaa Laundry",
  description: "خدمة غسيل ملابس احترافية في عرابة — طلب الاستلام وتتبع الطلبات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-cairo)]">
        {children}
      </body>
    </html>
  );
}
