import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "local-app-id",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "local-key",
  secret: process.env.PUSHER_SECRET || "local-secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

// Client-side Pusher
export const getPusherClient = () => {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "local-key", {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  });
};
