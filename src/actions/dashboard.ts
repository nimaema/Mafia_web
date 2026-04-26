"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getUserStats() {
  noStore();
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
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      role: true,
      game: {
        include: {
          scenario: true,
          moderator: true,
          players: {
            include: { role: true }
          }
        }
      }
    }
  });

  // Get current active game (IN_PROGRESS)
  const activePlayerRecord = await prisma.gamePlayer.findFirst({
    where: {
      userId,
      game: {
        status: "IN_PROGRESS"
      }
    },
    include: {
      game: {
        include: {
          scenario: true,
          moderator: true
        }
      }
    }
  });

  return {
    currentActiveGame: activePlayerRecord?.game ? {
      id: activePlayerRecord.game.id,
      scenarioName: activePlayerRecord.game.scenario?.name || "ناشناس",
      moderatorName: activePlayerRecord.game.moderator?.name || "مدیر",
    } : null,
    statsData: [
      { name: 'پیروزی‌ها', value: wins, color: '#84cc16' },
      { name: 'شکست‌ها', value: losses, color: '#ef4444' }
    ],
    roleHistory,
    recentGames: recentGames.map(rg => ({
      id: rg.gameId,
      roleName: rg.role.name,
      result: rg.result || "PENDING",
      date: rg.createdAt.toLocaleDateString('fa-IR'),
      scenarioName: rg.game.scenario?.name || "بدون سناریو",
      moderatorName: rg.game.moderator?.name || "ناشناس",
      players: rg.game.players.map(p => ({
        name: p.name,
        roleName: p.role?.name || "بدون نقش",
        alignment: p.role?.alignment || "NEUTRAL"
      }))
    }))
  };
}

export async function getAllUserHistory() {
  noStore();
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const history = await prisma.gameHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      role: true,
      game: {
        include: {
          scenario: true,
          moderator: true,
          players: {
            include: { role: true }
          }
        }
      }
    }
  });

  return history.map(rg => ({
    id: rg.gameId,
    roleName: rg.role.name,
    result: rg.result || "PENDING",
    date: rg.createdAt.toLocaleDateString('fa-IR'),
    scenarioName: rg.game.scenario?.name || "بدون سناریو",
    moderatorName: rg.game.moderator?.name || "ناشناس",
    players: rg.game.players.map(p => ({
      name: p.name,
      roleName: p.role?.name || "بدون نقش",
      alignment: p.role?.alignment || "NEUTRAL"
    }))
  }));
}

export async function deleteGameHistory(gameId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید");
  }

  try {
    await prisma.gameHistory.deleteMany({
      where: { gameId }
    });
    
    // Also delete the game to completely remove it
    await prisma.game.delete({
      where: { id: gameId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Delete history error:", error);
    return { error: "خطا در حذف تاریخچه بازی" };
  }
}
