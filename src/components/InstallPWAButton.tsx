"use client";

import { useEffect, useState } from "react";

export function InstallPWAButton() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

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
    if (!deferredPrompt) {
      setShowHelp((value) => !value);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="w-full">
      <button 
        onClick={handleInstallClick}
        className="ui-button-secondary w-full justify-start px-3"
      >
        <span className="material-symbols-outlined text-xl">{isInstallable ? "install_mobile" : "app_shortcut"}</span>
        <span className="truncate">{isInstallable ? "نصب اپلیکیشن" : "راهنمای نصب"}</span>
      </button>
      {showHelp && !isInstallable && (
        <div className="mt-2 rounded-lg border border-lime-500/20 bg-lime-500/10 p-3 text-xs leading-6 text-zinc-600 dark:text-zinc-300">
          از منوی مرورگر گزینه Add to Home Screen یا Install App را انتخاب کنید.
        </div>
      )}
    </div>
  );
}
