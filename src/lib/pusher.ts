import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

function pusherEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}

const pusherKey = pusherEnv("NEXT_PUBLIC_PUSHER_KEY", "local-key");
const pusherCluster = process.env.PUSHER_CLUSTER || pusherEnv("NEXT_PUBLIC_PUSHER_CLUSTER", "ap2");

// Server-side Pusher
export const pusherServer = new PusherServer({
  appId: pusherEnv("PUSHER_APP_ID", "local-app-id"),
  key: pusherKey,
  secret: pusherEnv("PUSHER_SECRET", "local-secret"),
  cluster: pusherCluster,
  useTLS: true,
});

// Client-side Pusher
export const getPusherClient = () => {
  return new PusherClient(pusherKey, {
    cluster: pusherCluster,
  });
};
