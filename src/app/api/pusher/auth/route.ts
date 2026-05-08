import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { profileImageUrl } from '@/lib/profileImage';
import { APP_PRESENCE_CHANNEL } from '@/lib/presence';

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response('دسترسی غیرمجاز است', { status: 401 });
  }

  const body = await req.formData();
  const socketId = body.get('socket_id') as string;
  const channel = body.get('channel_name') as string;

  if (!socketId || !/^\d+\.\d+$/.test(socketId) || channel !== APP_PRESENCE_CHANNEL) {
    return new Response("درخواست احراز هویت معتبر نیست", { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  const authResponse = pusherServer.authorizeChannel(socketId, channel, {
    user_id: session.user.id,
    user_info: {
      name: session.user.name || "کاربر",
      image: profileImageUrl(session.user.id, dbUser?.image) || session.user.image || null,
      role: session.user.role || "USER",
    },
  });

  return NextResponse.json(authResponse);
}
