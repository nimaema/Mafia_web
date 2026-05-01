import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { auth } from '@/auth';

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response('دسترسی غیرمجاز است', { status: 401 });
  }

  const body = await req.formData();
  const socketId = body.get('socket_id') as string;
  const channel = body.get('channel_name') as string;

  const authResponse = pusherServer.authorizeChannel(socketId, channel, {
    user_id: session.user.id!,
    user_info: {
      name: session.user.name,
      email: session.user.email,
    },
  });

  return NextResponse.json(authResponse);
}
