"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUserStats() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const totalGames = await prisma.gameHistory.count({
    where: { user_id: userId }
  });

  const wins = await prisma.gameHistory.count({
    where: { 
      user_id: userId,
      result: "WIN"
    }
  });

  const losses = await prisma.gameHistory.count({
    where: { 
      user_id: userId,
      result: "LOSS"
    }
  });

  const roleCounts = await prisma.gameHistory.groupBy({
    by: ['role_id'],
    where: { user_id: userId },
    _count: { role_id: true }
  });

  // Get role names
  const roles = await prisma.mafiaRole.findMany({
    where: {
      id: { in: roleCounts.map(r => r.role_id) }
    }
  });

  const roleHistory = roleCounts.map(rc => ({
    role: roles.find(r => r.id === rc.role_id)?.name || "ناشناس",
    count: rc._count.role_id
  }));

  const recentGames = await prisma.gameHistory.findMany({
    where: { user_id: userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      role: true,
      game: true
    }
  });

  return {
    statsData: [
      { name: 'پیروزی‌ها', value: wins, color: '#84cc16' },
      { name: 'شکست‌ها', value: losses, color: '#ef4444' }
    ],
    roleHistory,
    recentGames: recentGames.map(rg => ({
      id: rg.game_id,
      roleName: rg.role.name,
      result: rg.result,
      date: rg.createdAt.toLocaleDateString('fa-IR')
    }))
  };
}
