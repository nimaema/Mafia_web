"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { APP_PRESENCE_CHANNEL, type PresenceMember } from "@/lib/presence";

const CLIENT_ACTIVITY_THROTTLE_MS = 60 * 1000;

function publishPresence(channel: any) {
  if (typeof window === "undefined") return;

  const members: PresenceMember[] = [];
  channel?.members?.each?.((member: { id: string; info?: Omit<PresenceMember, "id"> }) => {
    members.push({
      id: member.id,
      name: member.info?.name || null,
      image: member.info?.image || null,
      role: member.info?.role || null,
    });
  });

  window.__mafiaPresence = {
    count: channel?.members?.count || members.length,
    members,
    updatedAt: Date.now(),
  };
  window.dispatchEvent(new CustomEvent("mafia-presence-change", { detail: window.__mafiaPresence }));
}

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

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(APP_PRESENCE_CHANNEL);
    const update = () => publishPresence(channel);

    channel.bind("pusher:subscription_succeeded", update);
    channel.bind("pusher:member_added", update);
    channel.bind("pusher:member_removed", update);

    return () => {
      channel.unbind("pusher:subscription_succeeded", update);
      channel.unbind("pusher:member_added", update);
      channel.unbind("pusher:member_removed", update);
      pusher.unsubscribe(APP_PRESENCE_CHANNEL);
      if (typeof window !== "undefined") {
        window.__mafiaPresence = { count: 0, members: [], updatedAt: Date.now() };
        window.dispatchEvent(new CustomEvent("mafia-presence-change", { detail: window.__mafiaPresence }));
      }
    };
  }, [session?.user?.id, status]);

  return null;
}
