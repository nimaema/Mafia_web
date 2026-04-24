import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id")!;
  const channelName = params.get("channel_name")!;

  const authData = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: session.user.id,
    user_info: { name: session.user.name, role: session.user.role },
  });

  return NextResponse.json(authData);
}
