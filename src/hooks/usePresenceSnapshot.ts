"use client";

import { useEffect, useState } from "react";
import { EMPTY_PRESENCE, type PresenceSnapshot } from "@/lib/presence";

export function usePresenceSnapshot() {
  const [presence, setPresence] = useState<PresenceSnapshot>(EMPTY_PRESENCE);

  useEffect(() => {
    const readPresence = () => {
      const snapshot = window.__mafiaPresence;
      if (snapshot) setPresence(snapshot);
    };

    const handlePresence = (event: Event) => {
      const detail = (event as CustomEvent<PresenceSnapshot>).detail;
      if (detail) setPresence(detail);
    };

    readPresence();
    window.addEventListener("mafia-presence-change", handlePresence);
    return () => window.removeEventListener("mafia-presence-change", handlePresence);
  }, []);

  return presence;
}
