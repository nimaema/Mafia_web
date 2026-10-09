import { Lalezar, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { InstallPWANotice } from "@/components/InstallPWANotice";
import { getConfiguredSiteUrl } from "@/lib/site";

const vazirmatn = Vazirmatn({ 
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const lalezar = Lalezar({
  weight: "400",
  subsets: ["arabic", "latin"],
  variable: "--font-lalezar",
  display: "swap",
});

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05101e" },
    { media: "(prefers-color-scheme: light)", color: "#f2f7f9" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getConfiguredSiteUrl()),
  title: {
    default: "نقاب | بازی مافیا با دوستان",
    template: "%s | نقاب",
  },
  description: "نقاب، تخته بازی مافیا برای دورهمی‌ها: نقش مخفی، شب و روز، رأی‌گیری و گزارش کامل بازی روی گوشی همه.",
  applicationName: "نقاب",
  keywords: ["نقاب", "مافیا", "بازی مافیا", "گرداننده مافیا", "سناریو مافیا", "Turku Games"],
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
    siteName: "نقاب",
    title: "نقاب | بازی مافیا با دوستان",
    description: "نقش مخفی، شب و روز، رأی‌گیری و گزارش کامل بازی مافیا روی گوشی همه.",
  },
  twitter: {
    card: "summary",
    title: "نقاب | بازی مافیا با دوستان",
    description: "نقش مخفی، شب و روز، رأی‌گیری و گزارش کامل بازی مافیا روی گوشی همه.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "نقاب",
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
      <body className={`${vazirmatn.variable} ${lalezar.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <InstallPWANotice />
        </Providers>
      </body>
    </html>
  );
}
