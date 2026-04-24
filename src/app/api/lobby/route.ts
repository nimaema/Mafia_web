import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const { action, lobbyId, data } = await req.json();

    await pusherServer.trigger(`lobby-${lobbyId}`, action, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lobby error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
