"use server";

import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function checkModerator() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MODERATOR") {
    throw new Error("Unauthorized: Only moderators can perform this action");
  }
  return session.user.id;
}

export async function joinGame(gameId: string, playerName: string, userId?: string) {
  if (!gameId || !playerName) {
    return { error: "Missing required fields" };
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return { error: "Game not found" };
    }

    if (game.status !== "WAITING") {
      return { error: "Game has already started" };
    }

    // Save to DB
    const player = await prisma.gamePlayer.create({
      data: {
        gameId,
        name: playerName,
        userId: userId || null,
      }
    });

    // Trigger Pusher event
    await pusherServer.trigger(`game-${gameId}`, 'player-joined', {
      player: {
        id: player.id,
        name: playerName
      }
    });

    return { success: true, playerId: player.id };
  } catch (error: any) {
    console.error("Join game error:", error);
    if (error.code === 'P2002') {
       return { error: "شما قبلا با این نام وارد شده‌اید" };
    }
    return { error: "Failed to join game" };
  }
}

export async function createGame(password?: string) {
  try {
    const moderatorId = await checkModerator();

    const game = await prisma.game.create({
      data: {
        moderatorId,
        password: password || null,
        status: "WAITING",
      }
    });

    // Notify all users about the new game
    await pusherServer.trigger('lobby', 'game-created', {
      gameId: game.id,
      moderatorName: "مدیر", // We could fetch this if needed
    });

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/moderator");
    
    return { success: true, gameId: game.id };
  } catch (error: any) {
    console.error("Create game error:", error);
    return { error: error.message || "Failed to create game" };
  }
}

export async function getWaitingGames() {
  return await prisma.game.findMany({
    where: { status: "WAITING" },
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
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getGameStatus(gameId: string) {
  return await prisma.game.findUnique({
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
      }
    }
  });
}

export async function startGame(gameId: string) {
  try {
    await checkModerator();
    
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "IN_PROGRESS" }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-started', {});
    
    return { success: true };
  } catch (error: any) {
    console.error("Start game error:", error);
    return { error: error.message || "Failed to start game" };
  }
}

export async function setGameScenario(gameId: string, scenarioId: string) {
  try {
    await checkModerator();
    await prisma.game.update({
      where: { id: gameId },
      data: { scenarioId }
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
    return { error: "Failed to set scenario" };
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
    return { error: "Failed to create custom scenario" };
  }
}
