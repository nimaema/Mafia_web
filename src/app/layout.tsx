import { Vazirmatn, Markazi_Text, Lalezar } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { InstallPWANotice } from "@/components/InstallPWANotice";
import { getConfiguredSiteUrl } from "@/lib/site";
import type { Metadata, Viewport } from "next";

// Body — the global RTL Persian workhorse.
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

// Display, light theme ("Daylight Atelier") — an elegant Persian serif.
const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-markazi",
  display: "swap",
});

// Display, dark theme ("Neon Tehran") — a bold, rounded poster face.
const lalezar = Lalezar({
  subsets: ["arabic", "latin"],
  weight: ["400"],
  variable: "--font-lalezar",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b0a14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const TITLE = "مافیا بورد — اتاق بازی";
const DESC = "اتاق فرمان بازی مافیا: لابی زنده، نقش‌های مخفی، چرخهٔ شب و روز و گزارش کامل بازی.";

export const metadata: Metadata = {
  metadataBase: new URL(getConfiguredSiteUrl()),
  title: TITLE,
  description: DESC,
  applicationName: "مافیا بورد",
  keywords: ["مافیا", "بازی مافیا", "گرداننده", "سناریو", "Mafia", "Persian Mafia"],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon", apple: "/apple-icon" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    siteName: "مافیا بورد",
    title: TITLE,
    description: DESC,
  },
  twitter: { card: "summary", title: TITLE, description: DESC },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: "مافیا بورد", statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${vazirmatn.variable} ${markazi.variable} ${lalezar.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <InstallPWANotice />
        </Providers>
      </body>
    </html>
  );
}
