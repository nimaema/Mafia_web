import { Vazirmatn, Markazi_Text } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { InstallPWANotice } from "@/components/InstallPWANotice";
import { getConfiguredSiteUrl } from "@/lib/site";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

// Markazi Text — an elegant Persian/Arabic serif used as the theatrical
// display face for headlines ("Midnight Salon" identity).
const markaziText = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-markazi",
  display: "swap",
});

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#130d18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const SITE_TITLE = "مافیا بورد — میز شب";
const SITE_DESC =
  "اتاق فرمان بازی مافیا: لابی زنده، نقش‌های مخفی، چرخه شب و روز و گزارش کامل بازی. برای موبایل ساخته شده.";

export const metadata: Metadata = {
  metadataBase: new URL(getConfiguredSiteUrl()),
  title: SITE_TITLE,
  description: SITE_DESC,
  applicationName: "مافیا بورد",
  keywords: ["مافیا", "بازی مافیا", "گرداننده", "سناریو", "Mafia", "Persian Mafia"],
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
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESC,
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
      <body className={`${vazirmatn.variable} ${markaziText.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <InstallPWANotice />
        </Providers>
      </body>
    </html>
  );
}
