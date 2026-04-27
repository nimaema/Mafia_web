"use server";

import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { unstable_noStore as noStore } from "next/cache";

async function checkModerator() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }
  return session.user.id;
}

export async function joinGame(code: string, playerName: string, password?: string) {
  if (!code || !playerName) {
    return { error: "فیلدهای اجباری ناقص است" };
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "برای پیوستن به بازی ابتدا وارد حساب خود شوید یا ثبت‌نام کنید." };
    }

    const game = await prisma.game.findUnique({
      where: { code: code },
    });

    if (!game) {
      return { error: "بازی یافت نشد" };
    }

    if (game.status !== "WAITING") {
      return { error: "بازی قبلاً شروع شده است" };
    }

    if (game.password && game.password !== password) {
      return { error: "رمز عبور اشتباه است" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true }
    });
    const finalPlayerName = dbUser?.name || playerName.trim() || dbUser?.email || "بازیکن";

    // Save to DB
    const player = await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        name: finalPlayerName,
        userId: session.user.id,
      }
    });

    // Trigger Pusher event
    await pusherServer.trigger(`game-${game.id}`, 'player-joined', {
      player: {
        id: player.id,
        name: finalPlayerName
      }
    });

    return { success: true, gameId: game.id, playerId: player.id };
  } catch (error: any) {
    console.error("Join game error:", error);
    if (error.code === 'P2002') {
       return { error: "شما قبلا با این نام وارد شده‌اید" };
    }
    return { error: "خطا در پیوستن به بازی" };
  }
}

export async function createGame(name?: string, password?: string) {
  try {
    const moderatorId = await checkModerator();
    
    // Generate a random 6-digit code for joining
    const gameCode = Math.floor(100000 + Math.random() * 900000).toString();

    const game = await prisma.game.create({
      data: {
        moderatorId,
        name: name || `بازی ${gameCode}`,
        code: gameCode,
        password: password || null,
        status: "WAITING",
      }
    });

    // Notify all users about the new game
    await pusherServer.trigger('lobby', 'game-created', {
      gameId: game.id,
      gameName: game.name,
      moderatorName: "مدیر", 
    });

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/moderator");
    
    return { success: true, gameId: game.id };
  } catch (error: any) {
    console.error("Create game error:", error);
    return { error: error.message || "خطا در ایجاد بازی" };
  }
}

export async function getWaitingGames(timestamp?: number) {
  noStore();
  return await prisma.game.findMany({
    where: { 
      status: "WAITING"
    },
    include: {
      moderator: {
        select: { name: true }
      },
      scenario: {
        select: { 
          name: true,
          roles: {
            include: { role: true }
          }
        }
      },
      _count: { select: { players: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getWaitingGamesSafe(timestamp?: number) {
  try {
    return { success: true, data: await getWaitingGames(timestamp) };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      data: [],
      error: "لابی‌های باز بارگذاری نشدند. اتصال پایگاه داده را بررسی کنید.",
    };
  }
}

export async function getModeratorGames(timestamp?: number) {
  noStore();
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید.");
  }

  const isAdmin = session.user.role === "ADMIN";
  
  return await prisma.game.findMany({
    where: { 
      ...(isAdmin ? {} : { moderatorId: session.user.id }),
      status: { in: ["WAITING", "IN_PROGRESS"] }
    },
    include: {
      moderator: { select: { name: true } },
      scenario: { 
        select: { 
          name: true,
          roles: {
            include: { role: true }
          }
        } 
      },
      _count: { select: { players: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getModeratorGamesSafe(timestamp?: number) {
  try {
    return { success: true, data: await getModeratorGames(timestamp) };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      data: [],
      error: "لیست بازی‌ها بارگذاری نشد. اتصال پایگاه داده یا سطح دسترسی را بررسی کنید.",
    };
  }
}

export async function getGameStatus(gameId: string) {
  noStore();
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      moderator: {
        select: { name: true }
      },
      scenario: {
        include: {
          roles: {
            include: { role: true }
          }
        }
      },
      players: {
        include: {
          role: true
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!game) return null;

  // Don't send the password to the client, just if it's required
  const { password, ...safeGame } = game;
  return {
    ...safeGame,
    hasPassword: !!password
  };
}

export async function getPlayerGameView(gameId: string) {
  noStore();
  const session = await auth();
  if (!session?.user?.id) return null;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      moderator: {
        select: { name: true }
      },
      scenario: true,
      players: {
        include: {
          role: true
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!game) return null;

  const currentPlayer = game.players.find((player) => player.userId === session.user.id) || null;

  const { password, players, ...safeGame } = game;

  return {
    ...safeGame,
    hasPassword: !!password,
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      userId: player.userId,
    })),
    myPlayer: currentPlayer
      ? {
          id: currentPlayer.id,
          name: currentPlayer.name,
          userId: currentPlayer.userId,
          role: currentPlayer.role,
        }
      : null,
  };
}

export async function startGame(gameId: string) {
  try {
    await checkModerator();
    
    // Fetch game with scenario and players
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
        scenario: {
          include: {
            roles: true
          }
        }
      }
    });

    if (!game || !game.scenario) {
      throw new Error("سناریو بازی یافت نشد");
    }

    // Prepare list of role IDs based on scenario count
    const roleIds: string[] = [];
    for (const sr of game.scenario.roles) {
      for (let i = 0; i < sr.count; i++) {
        roleIds.push(sr.roleId);
      }
    }

    if (game.players.length !== roleIds.length) {
      throw new Error(`تعداد بازیکنان (${game.players.length}) با تعداد نقش‌های سناریو (${roleIds.length}) مطابقت ندارد.`);
    }

    // Shuffle role IDs
    for (let i = roleIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roleIds[i], roleIds[j]] = [roleIds[j], roleIds[i]];
    }

    // Assign roles to players
    await prisma.$transaction(
      game.players.map((player, index) => 
        prisma.gamePlayer.update({
          where: { id: player.id },
          data: { roleId: roleIds[index] }
        })
      )
    );
    
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "IN_PROGRESS" }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-started', {});
    
    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/moderator");
    revalidatePath(`/dashboard/moderator/lobby/${gameId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Start game error:", error);
    return { error: error.message || "خطا در شروع بازی" };
  }
}

export async function setGameScenario(gameId: string, scenarioId: string) {
  try {
    await checkModerator();
    await prisma.game.update({
      where: { id: gameId },
      data: { scenarioId: scenarioId || null }
    });
    
    // Fetch updated game status with scenario to push to clients
    const updatedGame = await getGameStatus(gameId);
    
    // Notify users that scenario was updated
    await pusherServer.trigger(`game-${gameId}`, 'scenario-updated', {
      scenario: updatedGame?.scenario
    });
    
    revalidatePath(`/dashboard/moderator/lobby/${gameId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Set scenario error:", error);
    return { error: "خطا در تنظیم سناریو" };
  }
}

export async function createCustomGameScenario(gameId: string, roles: { roleId: string, count: number }[]) {
  try {
    const moderatorId = await checkModerator();
    
    // Create a temporary scenario specific to this game
    const scenario = await prisma.scenario.create({
      data: {
        name: `بازی سفارشی ${gameId.slice(0, 6)}`,
        description: "سناریو ساخته شده در لحظه",
        createdBy: moderatorId,
        roles: {
          create: roles.map(r => ({
            count: r.count,
            role: { connect: { id: r.roleId } }
          }))
        }
      }
    });

    // Assign it to the game
    return await setGameScenario(gameId, scenario.id);
  } catch (error: any) {
    console.error("Create custom scenario error:", error);
    return { error: "خطا در ایجاد سناریوی سفارشی" };
  }
}

export async function endGame(gameId: string, winningAlignment: string) {
  try {
    await checkModerator();

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: { role: true }
        }
      }
    });

    if (!game) throw new Error("بازی یافت نشد");

    // Close game
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "FINISHED" }
    });

    // Record histories for players that are registered users and have roles
    const historyData = game.players
      .filter(p => p.userId && p.roleId)
      .map(p => ({
        gameId,
        userId: p.userId as string,
        roleId: p.roleId as string,
        result: (p.role?.alignment === winningAlignment) ? "WIN" as const : "LOSS" as const
      }));

    if (historyData.length > 0) {
      await prisma.gameHistory.createMany({
        data: historyData,
        skipDuplicates: true
      });
    }

    // Trigger end game
    await pusherServer.trigger(`game-${gameId}`, 'game-ended', { winningAlignment });
    
    revalidatePath("/dashboard/moderator");
    revalidatePath("/dashboard/user");

    return { success: true };
  } catch (error: any) {
    console.error("End game error:", error);
    return { error: "خطا در پایان دادن به بازی" };
  }
}

export async function cancelGame(gameId: string) {
  try {
    await checkModerator();

    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) throw new Error("بازی یافت نشد");

    // Delete the game entirely (players will be cascade deleted)
    await prisma.game.delete({
      where: { id: gameId }
    });

    // Notify clients that the game was cancelled
    await pusherServer.trigger(`game-${gameId}`, 'game-cancelled', {});
    
    revalidatePath("/dashboard/moderator");
    revalidatePath("/dashboard/user");

    return { success: true };
  } catch (error: any) {
    console.error("Cancel game error:", error);
    return { error: "خطا در لغو بازی" };
  }
}
