import { auth } from "@/lib/auth";
import { getPusherServer } from "@/lib/realtime/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const form = await req.formData();
  const socketId = form.get("socket_id") as string;
  const channel = form.get("channel_name") as string;

  if (!socketId || !channel) {
    return new Response("Bad Request", { status: 400 });
  }

  const pusher = getPusherServer();

  if (channel.startsWith("presence-")) {
    const authResponse = pusher.authorizeChannel(socketId, channel, {
      user_id: session.user.id,
      user_info: { name: session.user.name },
    });
    return Response.json(authResponse);
  }

  if (channel.startsWith("private-")) {
    const authResponse = pusher.authorizeChannel(socketId, channel);
    return Response.json(authResponse);
  }

  return new Response("Forbidden: unknown channel prefix", { status: 403 });
}
