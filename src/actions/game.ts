"use server";

import { PrismaClient } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";

const prisma = new PrismaClient();

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
