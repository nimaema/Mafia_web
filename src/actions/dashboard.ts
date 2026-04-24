"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUserStats() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const totalGames = await prisma.gameHistory.count({
    where: { userId }
  });

  const wins = await prisma.gameHistory.count({
    where: { 
      userId,
      result: "WIN"
    }
  });

  const losses = await prisma.gameHistory.count({
    where: { 
      userId,
      result: "LOSS"
    }
  });

  // Group by roleId (camelCase)
  const roleCounts = await prisma.gameHistory.groupBy({
    by: ['roleId'],
    where: { userId },
    _count: { roleId: true }
  });

  // Get role details
  const roles = await prisma.mafiaRole.findMany({
    where: {
      id: { in: roleCounts.map(r => r.roleId) }
    }
  });

  const roleHistory = roleCounts.map(rc => ({
    role: roles.find(r => r.id === rc.roleId)?.name || "ناشناس",
    count: rc._count.roleId
  }));

  const recentGames = await prisma.gameHistory.findMany({
    where: { userId },
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
      id: rg.gameId,
      roleName: rg.role.name,
      result: rg.result || "PENDING",
      date: rg.createdAt.toLocaleDateString('fa-IR')
    }))
  };
}
