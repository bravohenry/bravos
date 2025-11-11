import Pusher, { Channel } from "pusher-js";

// App-wide singleton so we don't open/close the WebSocket on every React Strict-Mode remount.

const globalWithPusher = globalThis as typeof globalThis & {
  __pusherClient?: Pusher;
};

const PUSHER_APP_KEY = "818298b19bc907b9b419";
const PUSHER_CLUSTER = "us2";

export function getPusherClient(): Pusher {
  if (!globalWithPusher.__pusherClient) {
    // Create once and cache
    globalWithPusher.__pusherClient = new Pusher(PUSHER_APP_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });
  }
  return globalWithPusher.__pusherClient;
}

export type PusherChannel = Channel;
