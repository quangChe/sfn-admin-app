"use client";

import { useEffect } from "react";
import { getPusherClient } from "./client";

/**
 * Subscribe to a Pusher channel event.
 * Works with public, private-, and presence- channels.
 * The handler should be stable (memoized with useCallback) to avoid re-subscribing.
 */
export function useChannel<T>(
  channel: string,
  event: string,
  handler: (data: T) => void
): void {
  useEffect(() => {
    const pusher = getPusherClient();
    const ch = pusher.subscribe(channel);
    ch.bind(event, handler);
    return () => {
      ch.unbind(event, handler);
      pusher.unsubscribe(channel);
    };
  }, [channel, event, handler]);
}
