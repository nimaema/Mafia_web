"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gameDisplayName, scenarioDisplayDescription, scenarioDisplayName } from "@/lib/gameDisplay";
import { unstable_noStore as noStore } from "next/cache";

async function isCurrentAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  return Boolean(user && !user.isBanned && user.role === "ADMIN");
}

function formatHistoryRecord(rg: any) {
  return {
    id: rg.gameId,
    gameName: gameDisplayName(rg.game, "بازی مافیا"),
    gameCode: rg.game.code,
    roleName: rg.role.name,
    roleAlignment: rg.role.alignment,
    result: rg.result || "PENDING",
    date: rg.createdAt.toLocaleDateString("fa-IR"),
    scenarioName: scenarioDisplayName(rg.game.scenario),
    scenarioDescription: scenarioDisplayDescription(rg.game.scenario),
    moderatorName: rg.game.moderator?.name || "ناشناس",
    playerCount: rg.game.players.length,
    players: rg.game.players.map((p: any) => ({
      name: p.name,
      roleName: p.role?.name || "بدون نقش",
      alignment: p.role?.alignment || "NEUTRAL",
      isAlive: p.isAlive,
    })),
    nightRecordsPublic: Boolean(rg.game.nightRecordsPublic),
    nightEvents: rg.game.nightRecordsPublic
      ? rg.game.nightEvents.map((event: any) => ({
          id: event.id,
          nightNumber: event.nightNumber,
          abilityLabel: event.abilityLabel,
          abilityChoiceLabel: event.abilityChoiceLabel,
          abilitySource: event.abilitySource,
          actorName: event.actorPlayer?.name || null,
          targetName: event.targetPlayer?.name || null,
          actorAlignment: event.actorAlignment,
          wasUsed: event.wasUsed,
          details: event.details,
          note: event.note,
        }))
      : [],
  };
}

export async function getUserStats() {
  noStore();
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true }
  });

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

  const sortedRoleHistory = roleCounts
    .map(rc => ({
      role: roles.find(r => r.id === rc.roleId)?.name || "ناشناس",
      count: rc._count.roleId
    }))
    .sort((left, right) => right.count - left.count);
  const otherRoleCount = sortedRoleHistory.slice(6).reduce((sum, role) => sum + role.count, 0);
  const roleHistory = otherRoleCount > 0
    ? [...sortedRoleHistory.slice(0, 6), { role: "سایر نقش‌ها", count: otherRoleCount }]
    : sortedRoleHistory.slice(0, 6);

  const recentGames = await prisma.gameHistory.findMany({
    where: { userId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      role: true,
      game: {
        include: {
          scenario: { include: { roles: true } },
          moderator: true,
          players: {
            include: { role: true }
          },
          nightEvents: {
            where: { isPublic: true },
            include: {
              actorPlayer: true,
              targetPlayer: true,
            },
            orderBy: [{ nightNumber: "asc" }, { createdAt: "asc" }],
          },
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
          scenario: { include: { roles: true } },
          moderator: true
        }
      }
    }
  });

  return {
    userName: dbUser?.name,
    userImage: dbUser?.image,
    currentActiveGame: activePlayerRecord?.game ? {
      id: activePlayerRecord.game.id,
      scenarioName: scenarioDisplayName(activePlayerRecord.game.scenario, "ناشناس"),
      moderatorName: activePlayerRecord.game.moderator?.name || "مدیر",
    } : null,
    statsData: [
      { name: 'پیروزی‌ها', value: wins, color: '#84cc16' },
      { name: 'شکست‌ها', value: losses, color: '#ef4444' }
    ],
    roleHistory,
    recentGames: recentGames.map(formatHistoryRecord)
  };
}

export async function getUserStatsSafe() {
  try {
    return { success: true, data: await getUserStats() };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      data: null,
      error: "اطلاعات داشبورد بارگذاری نشد. اتصال پایگاه داده یا سطح دسترسی را بررسی کنید.",
    };
  }
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
          scenario: { include: { roles: true } },
          moderator: true,
          players: {
            include: { role: true }
          },
          nightEvents: {
            where: { isPublic: true },
            include: {
              actorPlayer: true,
              targetPlayer: true,
            },
            orderBy: [{ nightNumber: "asc" }, { createdAt: "asc" }],
          },
        }
      }
    }
  });

  return history.map(formatHistoryRecord);
}

export async function getUserHistoryPage(page = 0, pageSize = 10) {
  noStore();
  const session = await auth();
  if (!session?.user?.id) {
    return {
      items: [],
      total: 0,
      page: 0,
      pageSize,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  const safePageSize = Math.max(1, Math.min(10, pageSize));
  const safePage = Math.max(0, page);
  const userId = session.user.id;

  const [total, history] = await Promise.all([
    prisma.gameHistory.count({ where: { userId } }),
    prisma.gameHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: safePage * safePageSize,
      take: safePageSize,
      include: {
        role: true,
        game: {
          include: {
            scenario: { include: { roles: true } },
            moderator: true,
            players: {
              include: { role: true },
              orderBy: { createdAt: "asc" },
            },
            nightEvents: {
              where: { isPublic: true },
              include: {
                actorPlayer: true,
                targetPlayer: true,
              },
              orderBy: [{ nightNumber: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / safePageSize);

  return {
    items: history.map(formatHistoryRecord),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    hasNext: safePage + 1 < totalPages,
    hasPrevious: safePage > 0,
  };
}

export async function deleteGameHistory(gameId: string) {
  if (!(await isCurrentAdmin())) {
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

export async function getAdminGameHistoryPage(page = 0, pageSize = 10) {
  noStore();
  if (!(await isCurrentAdmin())) {
    return {
      items: [],
      total: 0,
      page: 0,
      pageSize,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
      error: "شما دسترسی لازم برای این بخش را ندارید.",
    };
  }

  const safePageSize = Math.max(1, Math.min(20, pageSize));
  const safePage = Math.max(0, page);
  const [total, games] = await Promise.all([
    prisma.game.count({ where: { histories: { some: {} } } }),
    prisma.game.findMany({
      where: { histories: { some: {} } },
      orderBy: { createdAt: "desc" },
      skip: safePage * safePageSize,
      take: safePageSize,
      include: {
        scenario: { include: { roles: true } },
        moderator: true,
        histories: {
          include: {
            user: true,
            role: true,
          },
          orderBy: { createdAt: "desc" },
        },
        players: { include: { role: true }, orderBy: { createdAt: "asc" } },
        nightEvents: {
          include: {
            actorPlayer: true,
            targetPlayer: true,
          },
          orderBy: [{ nightNumber: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / safePageSize);
  return {
    items: games.map((game) => ({
      id: game.id,
      gameName: gameDisplayName(game, "بازی مافیا"),
      gameCode: game.code,
      scenarioName: scenarioDisplayName(game.scenario),
      moderatorName: game.moderator?.name || "ناشناس",
      date: game.createdAt.toLocaleDateString("fa-IR"),
      historyCount: game.histories.length,
      playerCount: game.players.length,
      histories: game.histories.map((history) => ({
        userName: history.user.name || history.user.email || "کاربر",
        roleName: history.role.name,
        alignment: history.role.alignment,
        result: history.result || "PENDING",
      })),
      nightRecordsPublic: game.nightRecordsPublic,
      nightEvents: game.nightEvents.map((event) => ({
        id: event.id,
        nightNumber: event.nightNumber,
        abilityLabel: event.abilityLabel,
        abilityChoiceLabel: event.abilityChoiceLabel,
        abilitySource: event.abilitySource,
        actorName: event.actorPlayer?.name || null,
        targetName: event.targetPlayer?.name || null,
        actorAlignment: event.actorAlignment,
        wasUsed: event.wasUsed,
        details: event.details,
        note: event.note,
      })),
    })),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    hasNext: safePage + 1 < totalPages,
    hasPrevious: safePage > 0,
  };
}
