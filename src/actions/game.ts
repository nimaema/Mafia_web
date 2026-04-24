"use server";

import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function checkModerator() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("Unauthorized: Moderator access required");
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

    const playerId = userId || `guest-${Math.random().toString(36).substr(2, 9)}`;

    // Trigger Pusher event
    await pusherServer.trigger(`game-${gameId}`, 'player-joined', {
      player: {
        id: playerId,
        name: playerName
      }
    });

    return { success: true, playerId };
  } catch (error) {
    console.error("Join game error:", error);
    return { error: "Failed to join game" };
  }
}

export async function createGame(scenarioId: string, password?: string) {
  try {
    const moderatorId = await checkModerator();

    const game = await prisma.game.create({
      data: {
        moderatorId,
        scenarioId,
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
