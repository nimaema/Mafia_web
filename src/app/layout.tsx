import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { InstallPWANotice } from "@/components/InstallPWANotice";
import { getConfiguredSiteUrl } from "@/lib/site";

const vazirmatn = Vazirmatn({ 
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#15171b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getConfiguredSiteUrl()),
  title: "مافیا بورد - اتاق فرمان بازی",
  description: "اتاق فرمان مدرن برای اجرای بازی مافیا، لابی‌ها، سناریوها و گزارش‌ها",
  applicationName: "مافیا بورد",
  keywords: ["مافیا", "بازی مافیا", "گرداننده مافیا", "سناریو مافیا", "لابی مافیا"],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    siteName: "مافیا بورد",
    title: "مافیا بورد - اتاق فرمان بازی",
    description: "اتاق فرمان مدرن برای اجرای بازی مافیا، لابی‌ها، سناریوها و گزارش‌ها",
  },
  twitter: {
    card: "summary",
    title: "مافیا بورد - اتاق فرمان بازی",
    description: "اتاق فرمان مدرن برای اجرای بازی مافیا، لابی‌ها، سناریوها و گزارش‌ها",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "مافیا بورد",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <InstallPWANotice />
        </Providers>
      </body>
    </html>
  );
}
