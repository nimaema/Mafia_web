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
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <InstallPWANotice />
        </Providers>
      </body>
    </html>
  );
}
