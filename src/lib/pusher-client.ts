"use client";

import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "local-key", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
      authEndpoint: "/api/pusher/auth",
    });
  }
  return pusherClient;
}
