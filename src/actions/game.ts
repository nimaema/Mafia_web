"use server";

import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { TEMP_SCENARIO_DESCRIPTION_PREFIX, withGameDisplayName, withScenarioDisplayName } from "@/lib/gameDisplay";
import { profileImageUrl } from "@/lib/profileImage";
import { Alignment, Prisma } from "@prisma/client";

import { unstable_noStore as noStore } from "next/cache";

const STALE_GAME_HOURS = 8;

type WinningAlignmentInput = Alignment | "UNKNOWN" | null;

type NightEventInput = {
  nightNumber: number;
  abilityKey: string;
  abilityLabel: string;
  abilityChoiceKey?: string | null;
  abilityChoiceLabel?: string | null;
  abilitySource?: string | null;
  actorPlayerId?: string | null;
  targetPlayerId?: string | null;
  secondaryTargetPlayerId?: string | null;
  extraTargetPlayerIds?: string[] | null;
  targetLabels?: string[] | null;
  targetCount?: number | null;
  convertedRoleId?: string | null;
  effectType?: "NONE" | "CONVERT_TO_MAFIA" | "YAKUZA" | "TWO_NAME_INQUIRY" | null;
  actorAlignment?: Alignment | null;
  wasUsed?: boolean;
  note?: string | null;
};

type DayEliminationInput = {
  dayNumber: number;
  targetPlayerId?: string | null;
  methodKey?: string | null;
  methodLabel?: string | null;
  defensePlayerIds?: string[] | null;
  note?: string | null;
};

type ActiveRoleAbilityConfig = Record<string, string[]>;
type AbilityEffectType = "NONE" | "CONVERT_TO_MAFIA" | "YAKUZA" | "TWO_NAME_INQUIRY";

function realtimeSafeImage(userId?: string | null, image?: string | null) {
  return profileImageUrl(userId, image);
}

async function checkModerator() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }
  return session.user.id;
}

async function checkModeratorForGame(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, moderatorId: true, status: true, scenarioId: true, activeRoleAbilities: true },
  });

  if (!game) throw new Error("بازی یافت نشد");
  if (game.moderatorId !== session.user.id) {
    throw new Error("فقط سازنده همین بازی می‌تواند آن را مدیریت کند.");
  }

  return { userId: session.user.id, role: user.role, game };
}

function isAlignment(value: unknown): value is Alignment {
  return value === "CITIZEN" || value === "MAFIA" || value === "NEUTRAL";
}

function normalizeEffectType(value: unknown): AbilityEffectType {
  if (value === "CONVERT_TO_MAFIA" || value === "YAKUZA" || value === "TWO_NAME_INQUIRY") return value;
  return "NONE";
}

function inferEffectTypeFromLabel(label: string): AbilityEffectType {
  const normalized = label
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک");
  if (normalized.includes("یاکوز") || normalized.includes("yakuza")) return "YAKUZA";
  if (normalized.includes("خرید") || normalized.includes("kharid") || normalized.includes("convert")) return "CONVERT_TO_MAFIA";
  if (normalized.includes("بازپرس") || normalized.includes("bazpors") || normalized.includes("inquiry")) return "TWO_NAME_INQUIRY";
  return "NONE";
}

function normalizeRoleAbilityIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const record = item as { id?: unknown; label?: unknown };
      const label = String(record.label || "").trim();
      const id = String(record.id || `ability-${index + 1}`).trim();
      return label && id ? id : null;
    })
    .filter(Boolean) as string[];
}

function normalizeRoleAbilityDefinitions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const record = item as { id?: unknown; label?: unknown; effectType?: unknown };
      const label = String(record.label || "").trim();
      const id = String(record.id || `ability-${index + 1}`).trim();
      if (!label || !id) return null;
      return {
        id,
        label,
        effectType: normalizeEffectType(record.effectType),
      };
    })
    .filter(Boolean) as Array<{ id: string; label: string; effectType: AbilityEffectType }>;
}

function normalizeActiveRoleAbilityConfig(value: unknown, allowedRoleAbilities?: Map<string, Set<string>>): ActiveRoleAbilityConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<ActiveRoleAbilityConfig>((config, [roleId, abilityIds]) => {
    if (!Array.isArray(abilityIds)) return config;
    const allowed = allowedRoleAbilities?.get(roleId);
    const cleanIds = abilityIds
      .map((item) => String(item || "").trim())
      .filter((item, index, list) => item && list.indexOf(item) === index)
      .filter((item) => !allowed || allowed.has(item));
    config[roleId] = cleanIds;
    return config;
  }, {});
}

function buildDefaultActiveRoleAbilities(scenario?: { roles?: Array<{ roleId: string; role?: { nightAbilities?: unknown } | null }> } | null) {
  const config: ActiveRoleAbilityConfig = {};
  scenario?.roles?.forEach((scenarioRole) => {
    const abilityIds = normalizeRoleAbilityIds(scenarioRole.role?.nightAbilities);
    if (abilityIds.length === 1) config[scenarioRole.roleId] = [abilityIds[0]];
    if (abilityIds.length > 1) config[scenarioRole.roleId] = [];
  });
  return Object.keys(config).length ? (config as Prisma.InputJsonValue) : Prisma.JsonNull;
}

function sanitizeNightEvents(events: any[]) {
  return events.map((event) => ({
    ...event,
    actorPlayer: event.actorPlayer
      ? {
          id: event.actorPlayer.id,
          name: event.actorPlayer.name,
          isAlive: event.actorPlayer.isAlive,
          role: event.actorPlayer.role,
        }
      : null,
    targetPlayer: event.targetPlayer
      ? {
          id: event.targetPlayer.id,
          name: event.targetPlayer.name,
          isAlive: event.targetPlayer.isAlive,
          role: event.targetPlayer.role,
        }
      : null,
  }));
}

async function broadcastLobbyUpdated(reason: string, gameId?: string) {
  try {
    await pusherServer.trigger("lobby", "lobby-updated", {
      reason,
      gameId,
      at: Date.now(),
    });
  } catch (error) {
    console.error("Failed to broadcast lobby update:", error);
  }
}

async function expireStaleGames() {
  const cutoff = new Date(Date.now() - STALE_GAME_HOURS * 60 * 60 * 1000);
  const staleGames = await prisma.game.findMany({
    where: {
      status: { not: "FINISHED" },
      createdAt: { lte: cutoff },
    },
    include: {
      players: {
        include: { role: true },
      },
    },
  });

  if (staleGames.length === 0) return;

  for (const game of staleGames) {
    const endedAt = new Date();
    const historyData = game.players
      .filter((player) => player.userId && player.roleId)
      .map((player) => ({
        gameId: game.id,
        userId: player.userId as string,
        roleId: player.roleId as string,
        result: null,
      }));

    await prisma.$transaction(async (tx) => {
      await tx.game.update({
        where: { id: game.id },
        data: {
          status: "FINISHED",
          endedAt,
          winningAlignment: null,
        },
      });

      if (historyData.length > 0) {
        await tx.gameHistory.createMany({
          data: historyData,
          skipDuplicates: true,
        });
      }
    });

    try {
      await pusherServer.trigger(`game-${game.id}`, "game-ended", {
        winningAlignment: "UNKNOWN",
        reason: "expired",
      });
      await broadcastLobbyUpdated("game-expired", game.id);
    } catch (error) {
      console.error("Failed to broadcast expired game:", error);
    }
  }

  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/moderator");
  revalidatePath("/dashboard/admin/history");
}

export async function joinGame(code: string, playerName: string, password?: string) {
  if (!code || !playerName) {
    return { error: "فیلدهای اجباری ناقص است" };
  }

  try {
    await expireStaleGames();

    const session = await auth();
    if (!session?.user?.id) {
      return { error: "برای پیوستن به بازی ابتدا وارد حساب خود شوید یا ثبت‌نام کنید." };
    }

    const game = await prisma.game.findUnique({
      where: { code: code },
      include: {
        scenario: { include: { roles: true } },
        _count: { select: { players: true } },
      },
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

    const capacity = game.scenario?.roles.reduce((sum, role) => sum + role.count, 0) || 0;
    if (capacity > 0 && game._count.players >= capacity) {
      return { error: "ظرفیت این لابی تکمیل شده است. از گرداننده بخواهید سناریوی بزرگ‌تر انتخاب کند یا لابی جدید بسازد." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true }
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
        name: finalPlayerName,
        image: realtimeSafeImage(session.user.id, dbUser?.image),
        userId: session.user.id,
        isAlive: player.isAlive,
      }
    });
    await broadcastLobbyUpdated("player-joined", game.id);

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
        name: name?.trim() || "لابی مافیا",
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
  await expireStaleGames();
  const games = await prisma.game.findMany({
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
          description: true,
          roles: {
            include: { role: true }
          }
        }
      },
      _count: { select: { players: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return games.map((game) => withGameDisplayName(withScenarioDisplayName(game)));
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
  await expireStaleGames();
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید.");
  }

  const games = await prisma.game.findMany({
    where: { 
      moderatorId: session.user.id,
      status: { in: ["WAITING", "IN_PROGRESS"] }
    },
    include: {
      moderator: { select: { name: true } },
      scenario: { 
        select: { 
          name: true,
          description: true,
          roles: {
            include: { role: true }
          }
        } 
      },
      _count: { select: { players: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return games.map((game) => withGameDisplayName(withScenarioDisplayName(game)));
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
  await expireStaleGames();
  const session = await auth();
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
          role: true,
          user: { select: { image: true } }
        },
        orderBy: { createdAt: "asc" }
      },
      nightEvents: {
        include: {
          actorPlayer: { include: { role: true } },
          targetPlayer: { include: { role: true } },
        },
        orderBy: [{ nightNumber: "asc" }, { createdAt: "asc" }],
      },
    }
  });

  if (!game) return null;

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, isBanned: true },
      })
    : null;
  const canManageThisGame =
    !currentUser?.isBanned &&
    (currentUser?.role === "ADMIN" || currentUser?.role === "MODERATOR") &&
    session?.user?.id === game.moderatorId;
  const canSeePrivateNightEvents = canManageThisGame;
  const visibleNightEvents = canSeePrivateNightEvents || game.nightRecordsPublic
    ? game.nightEvents
    : game.nightEvents.filter((event) => event.isPublic);
  const playersWithSafeImages = game.players.map((player) => ({
    ...player,
    user: player.user
      ? {
          ...player.user,
          image: profileImageUrl(player.userId, player.user.image),
        }
      : player.user,
  }));
  const visiblePlayers = canSeePrivateNightEvents
    ? playersWithSafeImages
    : playersWithSafeImages.map((player) => ({
        ...player,
        roleId: null,
        role: null,
      }));
  const mafiaConversionRoles = canSeePrivateNightEvents
    ? await prisma.mafiaRole.findMany({
        where: { alignment: "MAFIA" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  // Don't send the password to the client, just if it's required
  const { password, nightEvents, players, ...safeGame } = game;
  return {
    ...withGameDisplayName(withScenarioDisplayName(safeGame)),
    players: visiblePlayers,
    nightEvents: sanitizeNightEvents(visibleNightEvents),
    mafiaConversionRoles,
    hasPassword: !!password
  };
}

export async function getPlayerGameView(gameId: string) {
  noStore();
  await expireStaleGames();
  const session = await auth();
  if (!session?.user?.id) return null;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      moderator: {
        select: { name: true }
      },
      scenario: {
        include: {
          roles: {
            include: { role: true },
          },
        },
      },
      players: {
        include: {
          role: true,
          user: { select: { image: true } }
        },
        orderBy: { createdAt: "asc" }
      },
      nightEvents: {
        where: { isPublic: true },
        include: {
          actorPlayer: { include: { role: true } },
          targetPlayer: { include: { role: true } },
        },
        orderBy: [{ nightNumber: "asc" }, { createdAt: "asc" }],
      },
    }
  });

  if (!game) return null;

  const currentPlayer = game.players.find((player) => player.userId === session.user.id) || null;

  const { password, players, nightEvents, ...safeGame } = game;

  return {
    ...withGameDisplayName(withScenarioDisplayName(safeGame)),
    hasPassword: !!password,
    nightEvents: sanitizeNightEvents(nightEvents),
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      userId: player.userId,
      image: profileImageUrl(player.userId, player.user?.image),
      isAlive: player.isAlive,
      eliminatedAt: player.eliminatedAt,
    })),
    myPlayer: currentPlayer
      ? {
          id: currentPlayer.id,
          name: currentPlayer.name,
          userId: currentPlayer.userId,
          image: profileImageUrl(currentPlayer.userId, currentPlayer.user?.image),
          isAlive: currentPlayer.isAlive,
          eliminatedAt: currentPlayer.eliminatedAt,
          role: currentPlayer.role,
        }
      : null,
  };
}

export async function startGame(gameId: string) {
  try {
    await checkModeratorForGame(gameId);
    
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
          data: { roleId: roleIds[index], isAlive: true, eliminatedAt: null }
        })
      )
    );
    
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: "IN_PROGRESS",
        endedAt: null,
        winningAlignment: null,
        nightRecordsPublic: false,
      }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-started', {});
    await broadcastLobbyUpdated("game-started", gameId);
    
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
    const { game } = await checkModeratorForGame(gameId);
    if (game.status !== "WAITING") {
      throw new Error("سناریو فقط قبل از شروع بازی قابل تغییر است.");
    }
    let selectedScenario: { roles: Array<{ roleId: string; count: number; role: { nightAbilities: Prisma.JsonValue } }> } | null = null;
    if (scenarioId) {
      const [game, scenario] = await Promise.all([
        prisma.game.findUnique({
          where: { id: gameId },
          include: { _count: { select: { players: true } } },
        }),
        prisma.scenario.findUnique({
          where: { id: scenarioId },
          include: { roles: { include: { role: true } } },
        }),
      ]);
      selectedScenario = scenario;
      const capacity = scenario?.roles.reduce((sum, role) => sum + role.count, 0) || 0;
      if (game && capacity > 0 && game._count.players > capacity) {
        const suggestions = await prisma.scenario.findMany({
          where: {
            roles: { some: {} },
          },
          include: { roles: true },
          orderBy: { updatedAt: "desc" },
        });
        const matchingNames = suggestions
          .filter((item) => item.roles.reduce((sum, role) => sum + role.count, 0) === game._count.players)
          .slice(0, 3)
          .map((item) => item.name);

        throw new Error(
          matchingNames.length
            ? `تعداد بازیکنان حاضر (${game._count.players}) از ظرفیت این سناریو (${capacity}) بیشتر است. سناریوهای مناسب: ${matchingNames.join("، ")}.`
            : `تعداد بازیکنان حاضر (${game._count.players}) از ظرفیت این سناریو (${capacity}) بیشتر است. یک سناریوی سفارشی ${game._count.players} نفره بسازید.`
        );
      }
    }

    await prisma.game.update({
      where: { id: gameId },
      data: {
        scenarioId: scenarioId || null,
        activeRoleAbilities: scenarioId ? buildDefaultActiveRoleAbilities(selectedScenario) : Prisma.JsonNull,
      }
    });
    
    // Fetch updated game status with scenario to push to clients
    const updatedGame = await getGameStatus(gameId);
    
    // Notify users that scenario was updated
    await pusherServer.trigger(`game-${gameId}`, 'scenario-updated', {
      scenario: updatedGame?.scenario,
      activeRoleAbilities: updatedGame?.activeRoleAbilities || null,
    });
    await broadcastLobbyUpdated("scenario-updated", gameId);
    
    revalidatePath(`/dashboard/moderator/lobby/${gameId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Set scenario error:", error);
    return { error: error.message || "خطا در تنظیم سناریو" };
  }
}

export async function setGameRoleAbilities(gameId: string, activeRoleAbilities: ActiveRoleAbilityConfig) {
  try {
    const { game } = await checkModeratorForGame(gameId);
    if (game.status !== "WAITING") {
      throw new Error("توانایی‌های سناریو فقط قبل از شروع بازی قابل تغییر است.");
    }

    const currentGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        scenario: {
          include: {
            roles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!currentGame?.scenario) {
      throw new Error("برای انتخاب توانایی‌ها ابتدا سناریو را انتخاب کنید.");
    }

    const allowed = new Map<string, Set<string>>();
    currentGame.scenario.roles.forEach((scenarioRole) => {
      allowed.set(scenarioRole.roleId, new Set(normalizeRoleAbilityIds(scenarioRole.role.nightAbilities)));
    });

    const normalized = normalizeActiveRoleAbilityConfig(activeRoleAbilities, allowed);
    await prisma.game.update({
      where: { id: gameId },
      data: {
        activeRoleAbilities: Object.keys(normalized).length ? (normalized as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    const updatedGame = await getGameStatus(gameId);

    await pusherServer.trigger(`game-${gameId}`, "ability-config-updated", {
      activeRoleAbilities: updatedGame?.activeRoleAbilities || null,
    });

    revalidatePath(`/dashboard/moderator/lobby/${gameId}`);
    return { success: true, activeRoleAbilities: updatedGame?.activeRoleAbilities || null };
  } catch (error: any) {
    console.error("Set game role abilities error:", error);
    return { error: error.message || "انتخاب توانایی‌های سناریو انجام نشد" };
  }
}

export async function createCustomGameScenario(
  gameId: string,
  roles: { roleId: string, count: number }[],
  saveToLibrary = false,
  scenarioName?: string
) {
  try {
    const { userId: moderatorId, game: currentGame } = await checkModeratorForGame(gameId);
    if (currentGame.status !== "WAITING") {
      throw new Error("سناریوی سفارشی فقط قبل از شروع بازی قابل تغییر است.");
    }
    const uniqueSuffix = `${gameId.slice(0, 6)}-${Date.now().toString(36)}`;
    const totalRoles = roles.reduce((sum, role) => sum + role.count, 0);
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { _count: { select: { players: true } } },
    });

    if (!game) throw new Error("لابی یافت نشد");
    if (totalRoles !== game._count.players) {
      throw new Error(`تعداد نقش‌ها (${totalRoles}) باید دقیقاً با تعداد بازیکنان حاضر (${game._count.players}) برابر باشد.`);
    }

    const cleanName = scenarioName?.trim();
    if (saveToLibrary && !cleanName) {
      throw new Error("برای ذخیره سناریو در کتابخانه، نام سناریو را وارد کنید.");
    }
    
    const scenario = await prisma.scenario.create({
      data: {
        name: saveToLibrary ? cleanName! : `بازی سفارشی ${uniqueSuffix}`,
        description: saveToLibrary
          ? "سناریو ذخیره‌شده از لابی بازی"
          : `${TEMP_SCENARIO_DESCRIPTION_PREFIX} سناریوی موقت این لابی`,
        createdBy: moderatorId,
        roles: {
          create: roles.map(r => ({
            count: r.count,
            role: { connect: { id: r.roleId } }
          }))
        }
      }
    });

    if (saveToLibrary) {
      revalidatePath("/dashboard/moderator/scenarios");
      revalidatePath("/dashboard/admin");
    }

    return await setGameScenario(gameId, scenario.id);
  } catch (error: any) {
    console.error("Create custom scenario error:", error);
    return { error: error.message || "خطا در ایجاد سناریوی سفارشی" };
  }
}

export async function setPlayerAliveStatus(gameId: string, playerId: string, isAlive: boolean) {
  try {
    await checkModeratorForGame(gameId);

    const player = await prisma.gamePlayer.findUnique({
      where: { id: playerId },
      select: { id: true, gameId: true, name: true },
    });

    if (!player || player.gameId !== gameId) {
      throw new Error("بازیکن در این بازی پیدا نشد.");
    }

    const updatedPlayer = await prisma.gamePlayer.update({
      where: { id: playerId },
      data: {
        isAlive,
        eliminatedAt: isAlive ? null : new Date(),
      },
      include: { role: true },
    });

    await pusherServer.trigger(`game-${gameId}`, "player-status-updated", {
      playerId,
      isAlive: updatedPlayer.isAlive,
      eliminatedAt: updatedPlayer.eliminatedAt,
    });

    revalidatePath(`/dashboard/moderator/game/${gameId}`);
    revalidatePath(`/game/${gameId}`);

    return { success: true, player: updatedPlayer };
  } catch (error: any) {
    console.error("Set player alive status error:", error);
    return { error: error.message || "تغییر وضعیت بازیکن انجام نشد" };
  }
}

export async function recordNightEvent(gameId: string, data: NightEventInput) {
  try {
    const { game } = await checkModeratorForGame(gameId);
    if (game.status === "FINISHED") {
      throw new Error("بازی پایان یافته و امکان ثبت شب جدید ندارد.");
    }

    const nightNumber = Math.max(1, Math.min(99, Math.floor(Number(data.nightNumber) || 1)));
    const abilityLabel = data.abilityLabel?.trim().slice(0, 80);
    const abilityKey = data.abilityKey?.trim().slice(0, 80);
    const abilityChoiceKey = data.abilityChoiceKey?.trim().slice(0, 80) || null;
    const abilityChoiceLabel = data.abilityChoiceLabel?.trim().slice(0, 80) || null;
    const abilitySource = data.abilitySource?.trim().slice(0, 40) || null;
    const note = data.note?.trim().slice(0, 500) || null;
    const wasUsed = data.wasUsed !== false;
    let effectType = normalizeEffectType(data.effectType);
    const targetCount = Math.max(1, Math.min(5, Math.floor(Number(data.targetCount) || 1)));

    if (!abilityLabel || !abilityKey) {
      throw new Error("نوع اتفاق شب را انتخاب کنید.");
    }

    const roleAbilityMatch = abilityKey.match(/^role:([^:]+):(.+)$/);
    if (roleAbilityMatch) {
      const [, roleId, abilityId] = roleAbilityMatch;
      const activeConfig = normalizeActiveRoleAbilityConfig(game.activeRoleAbilities);
      if (Object.prototype.hasOwnProperty.call(activeConfig, roleId) && !activeConfig[roleId].includes(abilityId)) {
        throw new Error("این توانایی برای سناریوی فعلی فعال نشده است.");
      }
    }

    const players = await prisma.gamePlayer.findMany({
      where: { gameId },
      include: { role: true },
    });
    const playerIds = new Set(players.map((player) => player.id));
    const actorPlayerId = data.actorPlayerId || null;
    const targetPlayerId = data.targetPlayerId || null;
    const secondaryTargetPlayerId = data.secondaryTargetPlayerId || null;
    const extraTargetPlayerIds = (Array.isArray(data.extraTargetPlayerIds) ? data.extraTargetPlayerIds : [])
      .map((playerId) => String(playerId || "").trim())
      .filter((playerId, index, list) => playerId && list.indexOf(playerId) === index)
      .slice(0, Math.max(0, targetCount - 2));
    const convertedRoleId = data.convertedRoleId || null;
    const targetPlayer = targetPlayerId ? players.find((player) => player.id === targetPlayerId) : null;
    const secondaryTargetPlayer = secondaryTargetPlayerId ? players.find((player) => player.id === secondaryTargetPlayerId) : null;
    const extraTargetPlayers = extraTargetPlayerIds.map((playerId) => players.find((player) => player.id === playerId)).filter(Boolean) as typeof players;
    const targetLabels = (Array.isArray(data.targetLabels) ? data.targetLabels : [])
      .map((label) => String(label || "").trim().slice(0, 60))
      .slice(0, targetCount);

    if (roleAbilityMatch) {
      const [, roleId, abilityId] = roleAbilityMatch;
      const role = players.find((player) => player.role?.id === roleId)?.role;
      const ability = normalizeRoleAbilityDefinitions(role?.nightAbilities).find((item) => item.id === abilityId);
      if (!ability) {
        throw new Error("تعریف توانایی این نقش در بازی پیدا نشد.");
      }

      const configuredEffectType = ability.effectType !== "NONE"
        ? ability.effectType
        : inferEffectTypeFromLabel(ability.label);
      if (configuredEffectType !== "NONE") {
        effectType = configuredEffectType;
      } else if (effectType !== "NONE") {
        throw new Error("رفتار ویژه فقط برای توانایی‌هایی مثل یاکوزا، خریداری یا بازپرسی قابل ثبت است.");
      }
    } else if (effectType !== "NONE") {
      throw new Error("رفتار ویژه فقط برای توانایی نقش قابل ثبت است.");
    }

    if (actorPlayerId && !playerIds.has(actorPlayerId)) {
      throw new Error("بازیکن انجام‌دهنده در این بازی نیست.");
    }
    if (targetPlayerId && !playerIds.has(targetPlayerId)) {
      throw new Error("بازیکن هدف در این بازی نیست.");
    }
    if (secondaryTargetPlayerId && !playerIds.has(secondaryTargetPlayerId)) {
      throw new Error("بازیکن دوم در این بازی نیست.");
    }
    if (extraTargetPlayerIds.some((playerId) => !playerIds.has(playerId))) {
      throw new Error("یکی از هدف‌های اضافه در این بازی نیست.");
    }
    const allTargetIds = [targetPlayerId, secondaryTargetPlayerId, ...extraTargetPlayerIds].filter(Boolean);
    if (wasUsed && new Set(allTargetIds).size !== allTargetIds.length) {
      throw new Error("هدف‌های یک توانایی باید بازیکنان متفاوت باشند.");
    }
    if (wasUsed && effectType === "TWO_NAME_INQUIRY" && !secondaryTargetPlayerId) {
      throw new Error("برای بازپرسی، دو اسم باید ثبت شود.");
    }
    if (wasUsed && effectType === "YAKUZA" && !secondaryTargetPlayerId) {
      throw new Error("برای یاکوزا، مافیای قربانی را انتخاب کنید.");
    }
    if (wasUsed && effectType === "YAKUZA" && targetPlayerId === secondaryTargetPlayerId) {
      throw new Error("در یاکوزا، قربانی مافیا و هدف خریداری باید دو بازیکن متفاوت باشند.");
    }
    if (wasUsed && effectType === "YAKUZA" && secondaryTargetPlayer?.role?.alignment !== "MAFIA") {
      throw new Error("قربانی یاکوزا باید از جبهه مافیا باشد.");
    }
    if (wasUsed && (effectType === "CONVERT_TO_MAFIA" || effectType === "YAKUZA") && targetPlayer?.role?.alignment === "MAFIA") {
      throw new Error("هدف خریداری باید از بیرون جبهه مافیا باشد.");
    }
    if (wasUsed && (effectType === "CONVERT_TO_MAFIA" || effectType === "YAKUZA") && !convertedRoleId) {
      throw new Error("نقش مافیایی مقصد را انتخاب کنید.");
    }

    const convertedRole = convertedRoleId
      ? await prisma.mafiaRole.findUnique({
          where: { id: convertedRoleId },
          select: { id: true, name: true, alignment: true },
        })
      : null;
    if (convertedRole && convertedRole.alignment !== "MAFIA") {
      throw new Error("نقش مقصد خریداری باید از جبهه مافیا باشد.");
    }

    const details = {
      effectType,
      targetCount,
      secondaryTargetPlayerId: secondaryTargetPlayer?.id || null,
      secondaryTargetName: secondaryTargetPlayer?.name || null,
      extraTargets: extraTargetPlayers.map((player) => ({ id: player.id, name: player.name })),
      targetLabels: targetLabels.length
        ? [targetPlayer, secondaryTargetPlayer, ...extraTargetPlayers]
            .slice(0, targetCount)
            .map((player, index) => ({
              label: targetLabels[index] || `گزینه ${index + 1}`,
              playerId: player?.id || null,
              playerName: player?.name || null,
            }))
            .filter((target) => target.playerId)
        : [],
      convertedRoleId: convertedRole?.id || null,
      convertedRoleName: convertedRole?.name || null,
      previousRoleName: targetPlayer?.role?.name || null,
      sacrificePlayerId: effectType === "YAKUZA" ? secondaryTargetPlayer?.id || null : null,
      sacrificePlayerName: effectType === "YAKUZA" ? secondaryTargetPlayer?.name || null : null,
    };

    const nightEvent = await prisma.$transaction(async (tx) => {
      if (wasUsed && convertedRole && targetPlayerId && (effectType === "CONVERT_TO_MAFIA" || effectType === "YAKUZA")) {
        await tx.gamePlayer.update({
          where: { id: targetPlayerId },
          data: { roleId: convertedRole.id },
        });
      }

      if (wasUsed && effectType === "YAKUZA" && secondaryTargetPlayerId) {
        await tx.gamePlayer.update({
          where: { id: secondaryTargetPlayerId },
          data: { isAlive: false, eliminatedAt: new Date() },
        });
      }

      return tx.nightEvent.create({
        data: {
          gameId,
          nightNumber,
          abilityKey,
          abilityLabel,
          abilityChoiceKey,
          abilityChoiceLabel,
          abilitySource,
          actorPlayerId,
          targetPlayerId: wasUsed ? targetPlayerId : null,
          actorAlignment: isAlignment(data.actorAlignment) ? data.actorAlignment : null,
          wasUsed,
          details: details as Prisma.InputJsonValue,
          note,
        },
        include: {
          actorPlayer: { include: { role: true } },
          targetPlayer: { include: { role: true } },
        },
      });
    });

    if (wasUsed && effectType === "YAKUZA" && secondaryTargetPlayerId) {
      await pusherServer.trigger(`game-${gameId}`, "player-status-updated", {
        playerId: secondaryTargetPlayerId,
        isAlive: false,
        eliminatedAt: new Date(),
      });
    }
    if (wasUsed && (effectType === "CONVERT_TO_MAFIA" || effectType === "YAKUZA")) {
      await pusherServer.trigger(`game-${gameId}`, "game-state-updated", {
        reason: effectType,
        targetPlayerId,
        convertedRoleId,
      });
    }

    revalidatePath(`/dashboard/moderator/game/${gameId}`);
    revalidatePath(`/game/${gameId}`);

    return { success: true, event: sanitizeNightEvents([nightEvent])[0] };
  } catch (error: any) {
    console.error("Record night event error:", error);
    return { error: error.message || "ثبت اتفاق شب انجام نشد" };
  }
}

export async function recordDayElimination(gameId: string, data: DayEliminationInput) {
  try {
    const { game } = await checkModeratorForGame(gameId);
    if (game.status === "FINISHED") {
      throw new Error("بازی پایان یافته و امکان ثبت حذف روز ندارد.");
    }

    const dayNumber = Math.max(1, Math.min(99, Math.floor(Number(data.dayNumber) || 1)));
    const targetPlayerId = data.targetPlayerId?.trim() || null;
    const methodKey = (data.methodKey || "custom").trim().slice(0, 40) || "custom";
    const methodLabel = (data.methodLabel || "حذف روز").trim().slice(0, 80) || "حذف روز";
    const defensePlayerIds = Array.from(
      new Set((data.defensePlayerIds || []).map((playerId) => playerId.trim()).filter(Boolean))
    ).slice(0, 20);
    const note = data.note?.trim().slice(0, 500) || null;

    if (methodKey === "vote" && defensePlayerIds.length === 0 && !targetPlayerId) {
      throw new Error("برای رای‌گیری، بازیکنان دفاع یا بازیکن حذف‌شده را انتخاب کنید.");
    }

    if (methodKey !== "vote" && !targetPlayerId) {
      throw new Error("بازیکن حذف‌شده را انتخاب کنید.");
    }

    const [targetPlayer, defensePlayers] = await Promise.all([
      targetPlayerId
        ? prisma.gamePlayer.findUnique({
            where: { id: targetPlayerId },
            include: { role: true },
          })
        : null,
      defensePlayerIds.length
        ? prisma.gamePlayer.findMany({
            where: { id: { in: defensePlayerIds } },
            include: { role: true },
          })
        : [],
    ]);

    if (targetPlayerId && (!targetPlayer || targetPlayer.gameId !== gameId)) {
      throw new Error("بازیکن انتخاب‌شده در این بازی نیست.");
    }
    if (defensePlayers.length !== defensePlayerIds.length || defensePlayers.some((player) => player.gameId !== gameId)) {
      throw new Error("یکی از بازیکنان دفاع در این بازی نیست.");
    }

    const details = {
      phase: "DAY",
      methodKey,
      methodLabel,
      effectType: "NONE",
      defensePlayers: defensePlayers
        .sort((left, right) => defensePlayerIds.indexOf(left.id) - defensePlayerIds.indexOf(right.id))
        .map((player) => ({ id: player.id, name: player.name, roleName: player.role?.name || null })),
    };

    const [updatedPlayer, dayEvent] = await prisma.$transaction(async (tx) => {
      const updated = targetPlayerId
        ? await tx.gamePlayer.update({
            where: { id: targetPlayerId },
            data: { isAlive: false, eliminatedAt: new Date() },
            include: { role: true },
          })
        : null;

      const event = await tx.nightEvent.create({
        data: {
          gameId,
          nightNumber: dayNumber,
          abilityKey: `day:${methodKey}`,
          abilityLabel: targetPlayerId ? `حذف روز: ${methodLabel}` : `رای‌گیری روز: ${methodLabel}`,
          abilitySource: "روز",
          targetPlayerId: targetPlayerId || null,
          wasUsed: true,
          details: details as Prisma.InputJsonValue,
          note,
        },
        include: {
          actorPlayer: { include: { role: true } },
          targetPlayer: { include: { role: true } },
        },
      });

      return [updated, event];
    });

    if (updatedPlayer && targetPlayerId) {
      await pusherServer.trigger(`game-${gameId}`, "player-status-updated", {
        playerId: targetPlayerId,
        isAlive: updatedPlayer.isAlive,
        eliminatedAt: updatedPlayer.eliminatedAt,
      });
    }
    await pusherServer.trigger(`game-${gameId}`, "game-state-updated", {
      reason: targetPlayerId ? "DAY_ELIMINATION" : "DAY_VOTE_DEFENSE",
      targetPlayerId: targetPlayerId || null,
      methodKey,
    });

    revalidatePath(`/dashboard/moderator/game/${gameId}`);
    revalidatePath(`/game/${gameId}`);

    return { success: true, event: sanitizeNightEvents([dayEvent])[0] };
  } catch (error: any) {
    console.error("Record day elimination error:", error);
    return { error: error.message || "ثبت حذف روز انجام نشد" };
  }
}

export async function deleteNightEvent(gameId: string, eventId: string) {
  try {
    await checkModeratorForGame(gameId);

    const event = await prisma.nightEvent.findUnique({
      where: { id: eventId },
      select: { gameId: true },
    });
    if (!event || event.gameId !== gameId) {
      throw new Error("رکورد شب پیدا نشد.");
    }

    await prisma.nightEvent.delete({ where: { id: eventId } });
    revalidatePath(`/dashboard/moderator/game/${gameId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Delete night event error:", error);
    return { error: error.message || "حذف رکورد شب انجام نشد" };
  }
}

export async function publishNightRecords(gameId: string) {
  try {
    const { game } = await checkModeratorForGame(gameId);
    if (game.status !== "FINISHED") {
      throw new Error("بعد از پایان بازی می‌توانید رکوردهای شب را عمومی کنید.");
    }

    await prisma.$transaction([
      prisma.game.update({
        where: { id: gameId },
        data: { nightRecordsPublic: true },
      }),
      prisma.nightEvent.updateMany({
        where: { gameId },
        data: { isPublic: true },
      }),
    ]);

    await pusherServer.trigger(`game-${gameId}`, "night-records-public", {});
    revalidatePath(`/dashboard/moderator/game/${gameId}`);
    revalidatePath(`/game/${gameId}`);
    revalidatePath("/dashboard/user/history");
    revalidatePath("/dashboard/admin/history");

    return { success: true };
  } catch (error: any) {
    console.error("Publish night records error:", error);
    return { error: error.message || "عمومی کردن رکوردهای شب انجام نشد" };
  }
}

export async function endGame(gameId: string, winningAlignment: WinningAlignmentInput) {
  try {
    await checkModeratorForGame(gameId);
    const normalizedWinningAlignment = isAlignment(winningAlignment) ? winningAlignment : null;

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
      data: {
        status: "FINISHED",
        endedAt: new Date(),
        winningAlignment: normalizedWinningAlignment,
      }
    });

    // Record histories for players that are registered users and have roles
    const historyData = game.players
      .filter(p => p.userId && p.roleId)
      .map(p => ({
        gameId,
        userId: p.userId as string,
        roleId: p.roleId as string,
        result: normalizedWinningAlignment
          ? ((p.role?.alignment === normalizedWinningAlignment) ? "WIN" as const : "LOSS" as const)
          : null
      }));

    if (historyData.length > 0) {
      await prisma.gameHistory.createMany({
        data: historyData,
        skipDuplicates: true
      });
    }

    // Trigger end game
    await pusherServer.trigger(`game-${gameId}`, 'game-ended', {
      winningAlignment: normalizedWinningAlignment || "UNKNOWN",
    });
    await broadcastLobbyUpdated("game-ended", gameId);
    
    revalidatePath("/dashboard/moderator");
    revalidatePath("/dashboard/user");
    revalidatePath(`/dashboard/moderator/game/${gameId}`);

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
    await broadcastLobbyUpdated("game-cancelled", gameId);
    
    revalidatePath("/dashboard/moderator");
    revalidatePath("/dashboard/user");

    return { success: true };
  } catch (error: any) {
    console.error("Cancel game error:", error);
    return { error: "خطا در لغو بازی" };
  }
}
