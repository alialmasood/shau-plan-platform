import type { Metadata } from "next";
import { Tajawal, Geist_Mono } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام إدارة الخطة العلمية - كلية الشرق للعلوم التنقنية التخصصية",
  description: "منصة متكاملة لإدارة البحوث العلمية والخطة البحثية باشراف مباشر من مكتب المساعد العلمي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${tajawal.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
