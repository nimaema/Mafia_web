"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";

const CLIENT_ACTIVITY_THROTTLE_MS = 60 * 1000;

export function ActivityTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const lastSentAt = useRef(0);

  const touchActivity = useCallback(
    (force = false) => {
      if (status !== "authenticated" || !session?.user?.id) return;

      const now = Date.now();
      if (!force && now - lastSentAt.current < CLIENT_ACTIVITY_THROTTLE_MS) return;

      lastSentAt.current = now;
      fetch("/api/user/activity", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => {
        lastSentAt.current = 0;
      });
    },
    [session?.user?.id, status]
  );

  useEffect(() => {
    touchActivity(true);
  }, [pathname, touchActivity]);

  useEffect(() => {
    const handleInteraction = () => touchActivity(false);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") touchActivity(true);
    };

    window.addEventListener("focus", handleInteraction);
    window.addEventListener("pointerdown", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleInteraction);
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [touchActivity]);

  return null;
}
