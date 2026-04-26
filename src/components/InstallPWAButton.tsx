"use client";

import { useEffect, useState } from "react";

export function InstallPWAButton() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="flex items-center justify-center gap-3 px-5 py-4 mt-2 rounded-2xl bg-lime-500/10 text-lime-600 dark:text-lime-400 hover:bg-lime-500 hover:text-zinc-950 transition-all duration-300 w-full group shadow-sm shadow-lime-500/10"
    >
      <span className="material-symbols-outlined group-hover:-translate-y-1 transition-transform">app_shortcut</span>
      <span className="font-black text-sm tracking-wide">نصب اپلیکیشن</span>
    </button>
  );
}
