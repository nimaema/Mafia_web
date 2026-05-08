"use client";

import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if ((!key || !cluster) && process.env.NODE_ENV === "production") {
    throw new Error("Pusher public configuration is missing.");
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(key || "local-key", {
      cluster: cluster || "ap2",
      authEndpoint: "/api/pusher/auth",
    });
  }
  return pusherClient;
}
