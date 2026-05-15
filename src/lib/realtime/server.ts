/**
 * Pusher server-side singleton.
 *
 * Channel naming conventions:
 *   presence-drops-{tag}-{stage}   — workspace presence per workflow stage
 *   private-drop-{tag}             — drop-level updates (pricing saves, signoffs, etc.)
 */
import Pusher from "pusher";
import { env } from "@/lib/env";

let _pusher: Pusher | undefined;

export function getPusherServer(): Pusher {
  if (!_pusher) {
    _pusher = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return _pusher;
}
