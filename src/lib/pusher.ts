import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

function pusherEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}

const pusherKey = pusherEnv("NEXT_PUBLIC_PUSHER_KEY", "local-key");
const pusherCluster = process.env.PUSHER_CLUSTER || pusherEnv("NEXT_PUBLIC_PUSHER_CLUSTER", "ap2");

const realtimeConfigured = Boolean(process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET && process.env.NEXT_PUBLIC_PUSHER_KEY);

// Server-side Pusher
export const pusherServer = new PusherServer({
  appId: pusherEnv("PUSHER_APP_ID", "local-app-id"),
  key: pusherKey,
  secret: pusherEnv("PUSHER_SECRET", "local-secret"),
  cluster: pusherCluster,
  useTLS: true,
});

// Local development without Pusher credentials: log and drop broadcasts so actions
// still succeed. Production always sends for real.
if (!realtimeConfigured && process.env.NODE_ENV !== "production") {
  pusherServer.trigger = (async (channel: string | string[], event: string) => {
    console.info(`[pusher:dev] ${String(channel)} -> ${event} (not sent: Pusher is not configured)`);
    return new Response(null, { status: 200 });
  }) as unknown as PusherServer["trigger"];
}

// Client-side Pusher
export const getPusherClient = () => {
  return new PusherClient(pusherKey, {
    cluster: pusherCluster,
  });
};
