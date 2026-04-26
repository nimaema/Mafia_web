import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const vazirmatn = Vazirmatn({ 
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#84cc16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "مافیا بورد - دستیار پیشرفته",
  description: "دستیار دیجیتال برای مدیریت حرفه‌ای بازی مافیا",
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
