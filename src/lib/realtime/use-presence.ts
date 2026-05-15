"use client";

import { useEffect, useState } from "react";
import type { PresenceChannel } from "pusher-js";
import { getPusherClient } from "./client";

export interface PresenceMember {
  id: string;
  info: { name: string };
}

interface PresenceData {
  members: Record<string, { name: string }>;
  myID: string;
}

/**
 * Subscribe to a Pusher presence channel.
 * Channel must start with "presence-" and the user must be authenticated.
 */
export function usePresence(channel: string): {
  members: PresenceMember[];
  me: PresenceMember | null;
} {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [me, setMe] = useState<PresenceMember | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const ch = pusher.subscribe(channel) as PresenceChannel;

    ch.bind("pusher:subscription_succeeded", (data: PresenceData) => {
      const memberList = Object.entries(data.members).map(([id, info]) => ({
        id,
        info,
      }));
      setMembers(memberList);
      setMe(memberList.find((m) => m.id === data.myID) ?? null);
    });

    ch.bind("pusher:member_added", (member: PresenceMember) => {
      setMembers((prev) => [...prev, member]);
    });

    ch.bind("pusher:member_removed", (member: { id: string }) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    });

    return () => {
      pusher.unsubscribe(channel);
    };
  }, [channel]);

  return { members, me };
}
