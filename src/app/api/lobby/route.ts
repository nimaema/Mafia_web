import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_ACTIONS = new Set([
  "player-joined",
  "scenario-updated",
  "ability-config-updated",
  "game-started",
  "game-state-updated",
  "game-ended",
  "game-cancelled",
]);

export async function POST(req: Request) {
  try {
    const { action, lobbyId, data } = await req.json();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز است' }, { status: 401 });
    }

    if (typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'رویداد لابی معتبر نیست' }, { status: 400 });
    }

    if (typeof lobbyId !== "string" || !/^[a-z0-9_-]{8,64}$/i.test(lobbyId)) {
      return NextResponse.json({ error: 'شناسه لابی معتبر نیست' }, { status: 400 });
    }

    if (JSON.stringify(data ?? {}).length > 10_000) {
      return NextResponse.json({ error: 'حجم داده رویداد بیش از حد مجاز است' }, { status: 413 });
    }

    const [user, game] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, isBanned: true },
      }),
      prisma.game.findUnique({
        where: { id: lobbyId },
        select: { moderatorId: true },
      }),
    ]);

    if (!user || user.isBanned || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز است' }, { status: 403 });
    }

    if (!game || game.moderatorId !== session.user.id) {
      return NextResponse.json({ error: 'فقط گرداننده همین لابی می‌تواند رویداد ارسال کند' }, { status: 403 });
    }

    await pusherServer.trigger(`lobby-${lobbyId}`, action, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lobby error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
