import { auth } from "@/lib/auth";
import { getPusherServer } from "@/lib/realtime/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const form = await req.formData();
  const socketId = form.get("socket_id") as string;

  if (!socketId) {
    return new Response("Bad Request", { status: 400 });
  }

  const pusher = getPusherServer();
  const authResponse = pusher.authenticateUser(socketId, {
    id: session.user.id,
    user_info: { name: session.user.name },
  });
  return Response.json(authResponse);
}
