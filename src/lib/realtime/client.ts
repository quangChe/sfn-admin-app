"use client";

import PusherJS from "pusher-js";

let _client: PusherJS | undefined;

/** Returns the shared Pusher client instance (one socket per page). */
export function getPusherClient(): PusherJS {
  if (!_client) {
    _client = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
      userAuthentication: {
        endpoint: "/api/pusher/user-auth",
        transport: "ajax",
      },
    });
  }
  return _client;
}
