import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Inter } from "next/font/google";
import "./globals.css";

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-kufi-arabic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travel Agency SaaS",
  description: "Multi-tenant travel agency management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${notoKufiArabic.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
