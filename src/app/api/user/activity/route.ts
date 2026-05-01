import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MIN_ACTIVITY_UPDATE_MS = 2 * 60 * 1000;

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveAt: true },
  });

  if (!user) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const now = new Date();
  const lastActiveAt = user.lastActiveAt?.getTime() || 0;

  if (now.getTime() - lastActiveAt >= MIN_ACTIVITY_UPDATE_MS) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: now },
    });
  }

  return NextResponse.json({ success: true });
}
