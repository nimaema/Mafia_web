import { Alignment, Prisma } from "@prisma/client";
import { gameDisplayName, scenarioDisplayDescription, scenarioDisplayName } from "@/lib/gameDisplay";

type SnapshotRole = {
  id?: string | null;
  name?: string | null;
  alignment?: Alignment | null;
};

type SnapshotPlayer = {
  id: string;
  userId?: string | null;
  name: string;
  isAlive?: boolean | null;
  roleId?: string | null;
  role?: SnapshotRole | null;
};

type SnapshotEvent = {
  id: string;
  nightNumber: number;
  abilityLabel: string;
  abilityChoiceLabel?: string | null;
  abilitySource?: string | null;
  actorAlignment?: Alignment | null;
  wasUsed?: boolean | null;
  details?: Prisma.JsonValue | null;
  note?: string | null;
  actorPlayer?: { name?: string | null } | null;
  targetPlayer?: { name?: string | null } | null;
};

type SnapshotGame = {
  id: string;
  name?: string | null;
  code?: string | null;
  scenario?: { name?: string | null; description?: string | null; roles?: Array<{ count: number }> | null } | null;
  moderator?: { name?: string | null; email?: string | null } | null;
  players: SnapshotPlayer[];
  nightRecordsPublic?: boolean | null;
  nightEvents?: SnapshotEvent[];
  winningAlignment?: Alignment | null;
  endedAt?: Date | null;
};

export function serializePlayersForHistory(players: SnapshotPlayer[]) {
  return players.map((player) => ({
    name: player.name,
    roleName: player.role?.name || "بدون نقش",
    alignment: player.role?.alignment || "NEUTRAL",
    isAlive: player.isAlive !== false,
  }));
}

export function serializeNightEventsForHistory(events: SnapshotEvent[] = []) {
  return events.map((event) => ({
    id: event.id,
    nightNumber: event.nightNumber,
    abilityLabel: event.abilityLabel,
    abilityChoiceLabel: event.abilityChoiceLabel || null,
    abilitySource: event.abilitySource || null,
    actorName: event.actorPlayer?.name || null,
    targetName: event.targetPlayer?.name || null,
    actorAlignment: event.actorAlignment || null,
    wasUsed: event.wasUsed !== false,
    details: event.details || null,
    note: event.note || null,
  }));
}

export function buildGameHistorySnapshot(game: SnapshotGame) {
  return {
    gameName: gameDisplayName(game, "بازی مافیا"),
    gameCode: game.code || null,
    scenarioName: scenarioDisplayName(game.scenario, "سناریو حذف‌شده"),
    scenarioDescription: scenarioDisplayDescription(game.scenario),
    moderatorName: game.moderator?.name || game.moderator?.email || "ناشناس",
    playerCount: game.players.length,
    playersSnapshot: serializePlayersForHistory(game.players) as Prisma.InputJsonValue,
    nightRecordsPublicSnapshot: Boolean(game.nightRecordsPublic),
    nightEventsSnapshot: serializeNightEventsForHistory(game.nightEvents || []) as Prisma.InputJsonValue,
    winningAlignment: game.winningAlignment || null,
    endedAt: game.endedAt || null,
  };
}

export function buildGameHistoryRows(game: SnapshotGame, winningAlignment: Alignment | null) {
  const snapshot = buildGameHistorySnapshot({ ...game, winningAlignment });

  return game.players
    .filter((player) => player.userId && player.roleId)
    .map((player) => ({
      gameId: game.id,
      userId: player.userId as string,
      roleId: player.roleId as string,
      roleName: player.role?.name || "نقش نامشخص",
      roleAlignment: player.role?.alignment || null,
      result: winningAlignment ? (player.role?.alignment === winningAlignment ? "WIN" as const : "LOSS" as const) : null,
      ...snapshot,
    }));
}

export function snapshotDataForPlayer(game: SnapshotGame, player?: SnapshotPlayer | null) {
  return {
    ...buildGameHistorySnapshot(game),
    roleName: player?.role?.name || "نقش نامشخص",
    roleAlignment: player?.role?.alignment || null,
  };
}
