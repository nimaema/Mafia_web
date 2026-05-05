"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gameDisplayName, scenarioDisplayDescription, scenarioDisplayName } from "@/lib/gameDisplay";
import { serializeNightEventsForHistory, serializePlayersForHistory, snapshotDataForPlayer } from "@/lib/gameHistorySnapshot";
import { profileImageUrl } from "@/lib/profileImage";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

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
  const liveGame = rg.game || null;
  const snapshotPlayers = Array.isArray(rg.playersSnapshot) ? rg.playersSnapshot : [];
  const snapshotNightEvents = Array.isArray(rg.nightEventsSnapshot) ? rg.nightEventsSnapshot : [];
  const livePlayers = liveGame?.players || [];
  const liveNightEvents = liveGame?.nightEvents || [];
  const hasLiveGame = Boolean(liveGame);
  const nightRecordsPublic = hasLiveGame ? Boolean(liveGame.nightRecordsPublic) : Boolean(rg.nightRecordsPublicSnapshot);

  return {
    id: rg.gameId || rg.id,
    gameName: hasLiveGame ? gameDisplayName(liveGame, "بازی مافیا") : rg.gameName || "بازی مافیا",
    gameCode: hasLiveGame ? liveGame.code : rg.gameCode,
    roleName: rg.role?.name || rg.roleName || "نقش نامشخص",
    roleAlignment: rg.role?.alignment || rg.roleAlignment || "NEUTRAL",
    result: rg.result || "PENDING",
    date: rg.createdAt.toLocaleDateString("fa-IR"),
    scenarioName: hasLiveGame ? scenarioDisplayName(liveGame.scenario) : rg.scenarioName || "سناریو حذف‌شده",
    scenarioDescription: hasLiveGame ? scenarioDisplayDescription(liveGame.scenario) : rg.scenarioDescription || "",
    moderatorName: hasLiveGame ? liveGame.moderator?.name || "ناشناس" : rg.moderatorName || "ناشناس",
    playerCount: hasLiveGame ? livePlayers.length : rg.playerCount || snapshotPlayers.length,
    players: hasLiveGame
      ? serializePlayersForHistory(livePlayers)
      : snapshotPlayers,
    nightRecordsPublic,
    nightEvents: nightRecordsPublic
      ? hasLiveGame
        ? serializeNightEventsForHistory(liveNightEvents)
        : snapshotNightEvents
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
    userImage: profileImageUrl(userId, dbUser?.image),
    currentActiveGame: activePlayerRecord?.game ? {
      id: activePlayerRecord.game.id,
      scenarioName: scenarioDisplayName(activePlayerRecord.game.scenario, "ناشناس"),
      moderatorName: activePlayerRecord.game.moderator?.name || "مدیر",
    } : null,
    statsData: [
      { name: 'پیروزی‌ها', value: wins, color: '#00f5d4' },
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
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        scenario: { include: { roles: true } },
        moderator: true,
        players: { include: { role: true } },
        nightEvents: {
          include: {
            actorPlayer: true,
            targetPlayer: true,
          },
          orderBy: [{ nightNumber: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!game) {
      return { success: true };
    }

    const playerByUserId = new Map(game.players.filter((player) => player.userId).map((player) => [player.userId as string, player]));
    const histories = await prisma.gameHistory.findMany({
      where: { gameId },
      select: { id: true, userId: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const history of histories) {
        await tx.gameHistory.update({
          where: { id: history.id },
          data: snapshotDataForPlayer(game, playerByUserId.get(history.userId) || null),
        });
      }

      await tx.game.delete({
        where: { id: gameId },
      });
    });

    revalidatePath("/dashboard/admin/history");
    revalidatePath("/dashboard/user/history");
    revalidatePath("/dashboard/user");

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
