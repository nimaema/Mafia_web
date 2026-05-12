import { revalidatePath } from "next/cache";
import { JoinSource, TelegramBotMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { profileImageUrl } from "@/lib/profileImage";
import { hashTelegramLinkToken } from "@/lib/telegramLink";
import { answerTelegramCallbackQuery, htmlEscape, sendTelegramMessage, type TelegramInlineKeyboardMarkup } from "@/lib/telegramApi";

const BOT_STATE_TTL_MS = 10 * 60 * 1000;

type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: {
    id: number;
    type: string;
  };
  from?: TelegramUser;
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: {
    chat: {
      id: number;
      type: string;
    };
  };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

function mainMenuKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🎮 Join Game", callback_data: "menu:join" },
        { text: "🎭 My Role", callback_data: "menu:role" },
      ],
      [
        { text: "📊 My Stats", callback_data: "menu:stats" },
        { text: "🚪 Leave Lobby", callback_data: "menu:leave" },
      ],
      [{ text: "👤 Account", callback_data: "menu:account" }],
    ],
  };
}

function homeKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: "🏠 Menu", callback_data: "menu:home" }]],
  };
}

function joinWaitingKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🚪 Leave Lobby", callback_data: "menu:leave" },
        { text: "👤 Account", callback_data: "menu:account" },
      ],
    ],
  };
}

function cancelKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: "Cancel", callback_data: "flow:cancel" }]],
  };
}

function roleRevealKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: "🎭 Show My Role", callback_data: "role:show" }]],
  };
}

function accountKeyboard(linked = true): TelegramInlineKeyboardMarkup {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "";
  const rows = [];
  if (siteUrl) rows.push([{ text: "🌐 Open Website", url: siteUrl }]);
  if (linked) rows.push([{ text: "🔌 Unlink Telegram", callback_data: "account:unlink" }]);
  rows.push([{ text: "🏠 Menu", callback_data: "menu:home" }]);
  return { inline_keyboard: rows };
}

function alignmentLabel(alignment?: string | null) {
  if (alignment === "MAFIA") return "Mafia";
  if (alignment === "CITIZEN") return "Citizen";
  if (alignment === "NEUTRAL") return "Neutral";
  return "Unknown";
}

function roleAbilitySummary(value: unknown) {
  if (!Array.isArray(value)) return "";
  const labels = value
    .map((item) => {
      const ability = item as { label?: unknown; usesPerGame?: unknown; usesPerNight?: unknown };
      const label = String(ability.label || "").trim();
      if (!label) return null;
      const limits = [
        typeof ability.usesPerGame === "number" ? `${ability.usesPerGame}x/game` : null,
        typeof ability.usesPerNight === "number" ? `${ability.usesPerNight}x/night` : null,
      ].filter(Boolean);
      return `• ${htmlEscape(label)}${limits.length ? ` (${limits.join(", ")})` : ""}`;
    })
    .filter(Boolean);
  return labels.length ? `\n\n<b>Abilities</b>\n${labels.join("\n")}` : "";
}

function telegramId(userId: number | string) {
  return String(userId);
}

async function linkedAccountForTelegram(userId: number | string) {
  return prisma.telegramAccount.findUnique({
    where: { telegramUserId: telegramId(userId) },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
}

async function sendNeedsLink(chatId: string) {
  await sendTelegramMessage(
    chatId,
    "👤 <b>Link your account first</b>\n\nOpen your website profile, tap <b>Link Telegram</b>, then return here.",
    accountKeyboard(false)
  );
}

async function broadcastLobbyUpdated(reason: string, gameId?: string) {
  try {
    await pusherServer.trigger("lobby", "lobby-updated", {
      reason,
      gameId,
      at: Date.now(),
    });
  } catch (error) {
    console.error("Failed to broadcast Telegram lobby update:", error);
  }
}

async function upsertBotState(telegramUserId: string, chatId: string, mode: TelegramBotMode, gameCode?: string | null) {
  await prisma.telegramBotState.upsert({
    where: { telegramUserId },
    update: {
      chatId,
      mode,
      gameCode: gameCode || null,
      expiresAt: new Date(Date.now() + BOT_STATE_TTL_MS),
    },
    create: {
      telegramUserId,
      chatId,
      mode,
      gameCode: gameCode || null,
      expiresAt: new Date(Date.now() + BOT_STATE_TTL_MS),
    },
  });
}

async function clearBotState(telegramUserId: string) {
  await prisma.telegramBotState.deleteMany({ where: { telegramUserId } });
}

async function joinTelegramGame(telegramUserId: string, chatId: string, rawCode: string, password?: string) {
  const account = await linkedAccountForTelegram(telegramUserId);
  if (!account) return { error: "Your Telegram account is not linked yet." };

  const code = rawCode.trim();
  if (!/^\d{4,8}$/.test(code)) return { error: "Please send a valid lobby code." };

  const game = await prisma.game.findUnique({
    where: { code },
    include: {
      scenario: { include: { roles: true } },
      _count: { select: { players: true } },
    },
  });

  if (!game) return { error: "Lobby not found." };
  if (game.status !== "WAITING") return { error: "This game has already started." };
  if (!game.telegramJoinEnabled) return { error: "Telegram joining is disabled for this lobby. Please join from the website." };

  const activePlayer = await prisma.gamePlayer.findFirst({
    where: {
      userId: account.userId,
      game: { status: { in: ["WAITING", "IN_PROGRESS"] } },
    },
    include: { game: true },
    orderBy: { createdAt: "desc" },
  });
  if (activePlayer && activePlayer.gameId !== game.id) {
    return { error: activePlayer.game.status === "WAITING" ? "You are already in another lobby. Leave it first." : "You are already in an active game." };
  }
  if (activePlayer && activePlayer.gameId === game.id) {
    return { success: true, game, alreadyJoined: true };
  }

  const blocked = await prisma.gameBlockedUser.findUnique({
    where: {
      gameId_userId: {
        gameId: game.id,
        userId: account.userId,
      },
    },
    select: { id: true },
  });
  if (blocked) return { error: "The moderator blocked your account from this lobby." };

  if (game.password && !password) {
    await upsertBotState(telegramUserId, chatId, "AWAITING_GAME_PASSWORD", code);
    return { needsPassword: true, game };
  }
  if (game.password && game.password !== password) {
    return { error: "Wrong lobby password." };
  }

  const capacity = game.scenario?.roles.reduce((sum, role) => sum + role.count, 0) || 0;
  if (capacity > 0 && game._count.players >= capacity) {
    return { error: "This lobby is full." };
  }

  const finalPlayerName = account.user.name || account.user.email || account.firstName || "Telegram player";
  const player = await prisma.gamePlayer.create({
    data: {
      gameId: game.id,
      userId: account.userId,
      name: finalPlayerName,
      joinSource: JoinSource.TELEGRAM,
    },
  });

  await clearBotState(telegramUserId);
  await pusherServer.trigger(`game-${game.id}`, "player-joined", {
    player: {
      id: player.id,
      name: finalPlayerName,
      image: profileImageUrl(account.userId, account.user.image),
      userId: account.userId,
      isAlive: player.isAlive,
      joinSource: player.joinSource,
    },
  });
  await broadcastLobbyUpdated("telegram-player-joined", game.id);
  revalidatePath(`/lobby/${game.id}`);
  revalidatePath(`/dashboard/moderator/lobby/${game.id}`);

  return { success: true, game };
}

async function handleTelegramLink(chatId: string, from: TelegramUser, token: string) {
  const tokenHash = hashTelegramLinkToken(token);
  const linkToken = await prisma.telegramLinkToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!linkToken || linkToken.expiresAt < new Date()) {
    await sendTelegramMessage(chatId, "⏱️ <b>This link expired.</b>\n\nOpen your website profile and create a new Telegram link.", accountKeyboard(false));
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.telegramAccount.deleteMany({
      where: {
        OR: [
          { userId: linkToken.userId },
          { telegramUserId: telegramId(from.id) },
        ],
      },
    });
    await tx.telegramAccount.create({
      data: {
        userId: linkToken.userId,
        telegramUserId: telegramId(from.id),
        chatId,
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
      },
    });
    await tx.telegramLinkToken.deleteMany({ where: { userId: linkToken.userId } });
  });

  revalidatePath("/dashboard/user/profile");
  await sendTelegramMessage(
    chatId,
    `✅ <b>Telegram linked</b>\n\nConnected to ${htmlEscape(linkToken.user.name || linkToken.user.email || "your account")}.`,
    mainMenuKeyboard()
  );
}

async function sendMainMenu(chatId: string, telegramUserId: string) {
  const account = await linkedAccountForTelegram(telegramUserId);
  if (!account) {
    await sendNeedsLink(chatId);
    return;
  }

  await sendTelegramMessage(
    chatId,
    `🎲 <b>Mafia Board</b>\n\nHi ${htmlEscape(account.user.name || account.firstName || "player")}. Choose an action below.`,
    mainMenuKeyboard()
  );
}

async function sendJoinPrompt(chatId: string, telegramUserId: string) {
  await upsertBotState(telegramUserId, chatId, "AWAITING_GAME_CODE");
  await sendTelegramMessage(
    chatId,
    "🎮 <b>Join Game</b>\n\nSend the lobby code. If the lobby is locked, I’ll ask for the password next.",
    cancelKeyboard()
  );
}

async function handleJoinText(chatId: string, telegramUserId: string, text: string, mode: TelegramBotMode, gameCode?: string | null) {
  const result = mode === "AWAITING_GAME_PASSWORD"
    ? await joinTelegramGame(telegramUserId, chatId, gameCode || "", text.trim())
    : await joinTelegramGame(telegramUserId, chatId, text.trim());

  if (result.needsPassword) {
    await sendTelegramMessage(
      chatId,
      `🔐 <b>Locked lobby</b>\n\nLobby <b>${htmlEscape(result.game?.name || result.game?.code || "game")}</b> needs a password. Send it here in this private chat.`,
      cancelKeyboard()
    );
    return;
  }

  if (result.success) {
    await sendTelegramMessage(
      chatId,
      result.alreadyJoined
        ? "✅ <b>You are already in this lobby.</b>\n\nThe game has not started yet."
        : "✅ <b>You joined the lobby.</b>\n\nThe game has not started yet. When it starts, I’ll send a button to reveal your role.",
      joinWaitingKeyboard()
    );
    return;
  }

  await sendTelegramMessage(chatId, `⚠️ <b>Could not join</b>\n\n${htmlEscape(result.error || "Please try again.")}`, mainMenuKeyboard());
}

async function sendRole(chatId: string, telegramUserId: string) {
  const account = await linkedAccountForTelegram(telegramUserId);
  if (!account) {
    await sendNeedsLink(chatId);
    return;
  }

  const activePlayer = await prisma.gamePlayer.findFirst({
    where: {
      userId: account.userId,
      game: { status: "IN_PROGRESS" },
    },
    include: {
      role: true,
      game: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activePlayer) {
    const waitingPlayer = await prisma.gamePlayer.findFirst({
      where: { userId: account.userId, game: { status: "WAITING" } },
      include: { game: { select: { name: true, code: true } } },
      orderBy: { createdAt: "desc" },
    });
    await sendTelegramMessage(
      chatId,
      waitingPlayer
        ? "⏳ <b>The game has not started yet.</b>\n\nYour role will be available after the moderator starts the game."
        : "🎭 <b>No active role</b>\n\nYou are not in an active game right now.",
      mainMenuKeyboard()
    );
    return;
  }

  if (!activePlayer.role) {
    await sendTelegramMessage(chatId, "⏳ <b>Your role is not ready yet.</b>\n\nTry again in a moment.", mainMenuKeyboard());
    return;
  }

  const role = activePlayer.role;
  await sendTelegramMessage(
    chatId,
    `🎭 <b>Your Role</b>\n\n<b>${htmlEscape(role.name)}</b>\n${htmlEscape(alignmentLabel(role.alignment))}\n\n${htmlEscape(role.description || "No description saved for this role.")}${roleAbilitySummary(role.nightAbilities)}`,
    homeKeyboard()
  );
}

async function sendStats(chatId: string, telegramUserId: string) {
  const account = await linkedAccountForTelegram(telegramUserId);
  if (!account) {
    await sendNeedsLink(chatId);
    return;
  }

  const history = await prisma.gameHistory.findMany({
    where: { userId: account.userId },
    select: { result: true, roleName: true, role: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const played = history.length;
  const wins = history.filter((row) => row.result === "WIN").length;
  const losses = history.filter((row) => row.result === "LOSS").length;
  const roleCounts = new Map<string, number>();
  history.forEach((row) => {
    const name = row.roleName || row.role?.name;
    if (name) roleCounts.set(name, (roleCounts.get(name) || 0) + 1);
  });
  const topRole = [...roleCounts.entries()].sort((left, right) => right[1] - left[1])[0];
  const winRate = played ? Math.round((wins / played) * 100) : 0;

  await sendTelegramMessage(
    chatId,
    `📊 <b>My Stats</b>\n\nGames: <b>${played}</b>\nWins: <b>${wins}</b>\nLosses: <b>${losses}</b>\nWin rate: <b>${winRate}%</b>${topRole ? `\nMost played role: <b>${htmlEscape(topRole[0])}</b> (${topRole[1]})` : ""}`,
    mainMenuKeyboard()
  );
}

async function sendLeavePrompt(chatId: string, telegramUserId: string) {
  const account = await linkedAccountForTelegram(telegramUserId);
  if (!account) {
    await sendNeedsLink(chatId);
    return;
  }

  const waitingPlayer = await prisma.gamePlayer.findFirst({
    where: { userId: account.userId, game: { status: "WAITING" } },
    include: { game: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!waitingPlayer) {
    await sendTelegramMessage(chatId, "🚪 <b>No waiting lobby</b>\n\nYou can only leave before the game starts.", mainMenuKeyboard());
    return;
  }

  await sendTelegramMessage(
    chatId,
    `🚪 <b>Leave Lobby?</b>\n\nYou are in <b>${htmlEscape(waitingPlayer.game.name || waitingPlayer.game.code || "this lobby")}</b>.`,
    {
      inline_keyboard: [
        [
          { text: "Leave Lobby", callback_data: "leave:confirm" },
          { text: "Cancel", callback_data: "menu:home" },
        ],
      ],
    }
  );
}

async function leaveWaitingLobby(chatId: string, telegramUserId: string) {
  const account = await linkedAccountForTelegram(telegramUserId);
  if (!account) {
    await sendNeedsLink(chatId);
    return;
  }

  const waitingPlayer = await prisma.gamePlayer.findFirst({
    where: { userId: account.userId, game: { status: "WAITING" } },
    include: { game: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (!waitingPlayer) {
    await sendTelegramMessage(chatId, "🚪 <b>No waiting lobby</b>\n\nThe game may have already started.", mainMenuKeyboard());
    return;
  }

  await prisma.gamePlayer.delete({ where: { id: waitingPlayer.id } });
  await pusherServer.trigger(`game-${waitingPlayer.game.id}`, "player-left", {
    playerId: waitingPlayer.id,
    userId: account.userId,
  });
  await broadcastLobbyUpdated("telegram-player-left", waitingPlayer.game.id);
  revalidatePath(`/lobby/${waitingPlayer.game.id}`);
  revalidatePath(`/dashboard/moderator/lobby/${waitingPlayer.game.id}`);

  await sendTelegramMessage(chatId, "✅ <b>You left the lobby.</b>", mainMenuKeyboard());
}

async function sendAccount(chatId: string, telegramUserId: string) {
  const account = await linkedAccountForTelegram(telegramUserId);
  if (!account) {
    await sendNeedsLink(chatId);
    return;
  }

  await sendTelegramMessage(
    chatId,
    `👤 <b>Account</b>\n\nWebsite: <b>${htmlEscape(account.user.name || account.user.email || "Linked user")}</b>\nTelegram: <b>${htmlEscape(account.username ? `@${account.username}` : account.firstName || "Linked")}</b>`,
    accountKeyboard(true)
  );
}

async function confirmUnlink(chatId: string) {
  await sendTelegramMessage(chatId, "🔌 <b>Unlink Telegram?</b>\n\nYou can link again later from your website profile.", {
    inline_keyboard: [
      [
        { text: "Unlink", callback_data: "account:unlink:confirm" },
        { text: "Cancel", callback_data: "menu:account" },
      ],
    ],
  });
}

async function unlinkFromTelegram(chatId: string, telegramUserId: string) {
  await prisma.telegramAccount.deleteMany({ where: { telegramUserId } });
  await prisma.telegramBotState.deleteMany({ where: { telegramUserId } });
  revalidatePath("/dashboard/user/profile");
  await sendTelegramMessage(chatId, "✅ <b>Telegram unlinked.</b>\n\nLink again from your website profile whenever you need the bot.", accountKeyboard(false));
}

async function handleMessage(message: TelegramMessage) {
  const chatId = String(message.chat.id);
  const from = message.from;
  const text = (message.text || "").trim();

  if (!from || from.is_bot) return;
  if (message.chat.type !== "private") {
    await sendTelegramMessage(chatId, "Please DM me privately so roles and account data stay private.");
    return;
  }

  const startMatch = text.match(/^\/start(?:\s+(.+))?$/);
  if (startMatch) {
    const token = startMatch[1]?.trim();
    if (token) {
      await handleTelegramLink(chatId, from, token);
    } else {
      await sendMainMenu(chatId, telegramId(from.id));
    }
    return;
  }

  const telegramUserId = telegramId(from.id);
  const state = await prisma.telegramBotState.findUnique({ where: { telegramUserId } });
  if (state && state.expiresAt > new Date()) {
    await handleJoinText(chatId, telegramUserId, text, state.mode, state.gameCode);
    return;
  }
  if (state) await clearBotState(telegramUserId);

  await sendMainMenu(chatId, telegramUserId);
}

async function handleCallback(callbackQuery: TelegramCallbackQuery) {
  const chatId = callbackQuery.message?.chat.id ? String(callbackQuery.message.chat.id) : null;
  const data = callbackQuery.data || "";
  const telegramUserId = telegramId(callbackQuery.from.id);
  if (!chatId) return;

  await answerTelegramCallbackQuery(callbackQuery.id);

  if (callbackQuery.message?.chat.type !== "private") {
    await sendTelegramMessage(chatId, "Please DM me privately so roles and account data stay private.");
    return;
  }

  if (data === "flow:cancel") {
    await clearBotState(telegramUserId);
    await sendMainMenu(chatId, telegramUserId);
    return;
  }
  if (data === "menu:home") return sendMainMenu(chatId, telegramUserId);
  if (data === "menu:join") return sendJoinPrompt(chatId, telegramUserId);
  if (data === "menu:role" || data === "role:show") return sendRole(chatId, telegramUserId);
  if (data === "menu:stats") return sendStats(chatId, telegramUserId);
  if (data === "menu:leave") return sendLeavePrompt(chatId, telegramUserId);
  if (data === "leave:confirm") return leaveWaitingLobby(chatId, telegramUserId);
  if (data === "menu:account") return sendAccount(chatId, telegramUserId);
  if (data === "account:unlink") return confirmUnlink(chatId);
  if (data === "account:unlink:confirm") return unlinkFromTelegram(chatId, telegramUserId);

  await sendMainMenu(chatId, telegramUserId);
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
  if (update.message) {
    await handleMessage(update.message);
  }
}

export async function notifyTelegramGameStarted(gameId: string) {
  const players = await prisma.gamePlayer.findMany({
    where: {
      gameId,
      joinSource: JoinSource.TELEGRAM,
      user: { telegramAccount: { isNot: null } },
    },
    include: {
      role: true,
      game: { select: { name: true, code: true } },
      user: { include: { telegramAccount: true } },
    },
  });

  await Promise.allSettled(
    players.map((player) => {
      const chatId = player.user?.telegramAccount?.chatId;
      if (!chatId) return Promise.resolve();
      return sendTelegramMessage(
        chatId,
        `🎲 <b>The game has started.</b>\n\n${htmlEscape(player.game.name || `Lobby ${player.game.code}`)} is now active. Tap below when you are ready to see your role.`,
        { replyMarkup: roleRevealKeyboard() }
      );
    })
  );
}
