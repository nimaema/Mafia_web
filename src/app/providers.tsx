"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { PopupProvider } from "@/components/PopupProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <PopupProvider>
          {children}
        </PopupProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
