"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

export async function createGame(scenarioId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const game = await prisma.game.create({
    data: {
      moderatorId: session.user.id,
      scenarioId,
      status: "WAITING",
    },
  });

  revalidatePath("/lobby");
  return game;
}

export async function joinGame(gameId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const player = await prisma.player.create({
    data: {
      gameId,
      userId: session.user.id,
    },
  });

  await pusherServer.trigger(`game-${gameId}`, "player-joined", {
    userId: session.user.id,
    name: session.user.name,
  });

  revalidatePath(`/game/${gameId}`);
  return player;
}

export async function startGame(gameId: string) {
  const session = await auth();
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { scenario: { include: { roles: true } } },
  });

  if (game?.moderatorId !== session?.user?.id) throw new Error("Unauthorized");

  // Basic role assignment logic
  const players = await prisma.player.findMany({ where: { gameId } });
  const rolesToAssign: string[] = [];
  game.scenario?.roles.forEach((sr) => {
    for (let i = 0; i < sr.count; i++) rolesToAssign.push(sr.roleId);
  });

  // Shuffle
  for (let i = rolesToAssign.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolesToAssign[i], rolesToAssign[j]] = [rolesToAssign[j], rolesToAssign[i]];
  }

  await Promise.all(
    players.map((player, idx) =>
      prisma.player.update({
        where: { id: player.id },
        data: { roleId: rolesToAssign[idx] || null },
      })
    )
  );

  await prisma.game.update({
    where: { id: gameId },
    data: { status: "RUNNING" },
  });

  await pusherServer.trigger(`game-${gameId}`, "game-started", {});

  revalidatePath(`/game/${gameId}`);
  revalidatePath("/dashboard/moderator");
  revalidatePath("/dashboard/user");

  return { ok: true };
}
