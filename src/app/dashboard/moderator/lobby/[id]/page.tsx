"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
import { cancelGame, createCustomGameScenario, getGameStatus, removeWaitingLobbyPlayer, setGameRoleAbilities, setGameScenario, setTelegramJoinEnabled, startGame } from "@/actions/game";
import { getScenarios } from "@/actions/admin";
import { getRoles } from "@/actions/role";
import { usePopup } from "@/components/PopupProvider";
import { LobbyPreviewCard } from "@/components/game/LobbyPreviewCard";
import { MobilePwaFeatureLock } from "@/components/MobilePwaFeatureLock";

type Player = {
  id: string;
  name: string;
  userId?: string | null;
  image?: string | null;
  isAlive?: boolean;
  joinSource?: "WEB" | "TELEGRAM";
};

type AbilityEffectType = "NONE" | "CONVERT_TO_MAFIA" | "YAKUZA" | "TWO_NAME_INQUIRY";

type RoleNightAbility = {
  id: string;
  label: string;
  usesPerGame: number | null;
  usesPerNight: number | null;
  targetsPerUse: number;
  selfTargetLimit: number | null;
  effectType: AbilityEffectType;
  choices: { id: string; label: string; usesPerGame: number | null; effectType?: AbilityEffectType }[];
};

type ActiveRoleAbilityConfig = Record<string, string[]>;

type ScenarioAbilityRole = {
  roleId: string;
  name: string;
  alignment?: string;
  count: number;
  abilities: RoleNightAbility[];
};

function alignmentClass(alignment?: string) {
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
}

function alignmentLabel(alignment?: string) {
  if (alignment === "MAFIA") return "مافیا";
  if (alignment === "CITIZEN") return "شهروند";
  return "مستقل";
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ۀة]/g, "ه")
    .replace(/\u200c/g, " ")
    .replace(/[\u064b-\u065f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function scenarioCounts(scenario: any) {
  return (scenario?.roles || []).reduce(
    (counts: Record<string, number>, item: any) => {
      const alignment = item.role?.alignment || "NEUTRAL";
      counts[alignment] += item.count || 0;
      counts.total += item.count || 0;
      return counts;
    },
    { CITIZEN: 0, MAFIA: 0, NEUTRAL: 0, total: 0 }
  );
}

function normalizeEffectType(value: unknown): AbilityEffectType {
  if (value === "CONVERT_TO_MAFIA" || value === "YAKUZA" || value === "TWO_NAME_INQUIRY") return value;
  return "NONE";
}

function effectLabel(effectType?: AbilityEffectType) {
  if (effectType === "CONVERT_TO_MAFIA") return "خریداری";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره";
  return "ثبت ساده";
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

function normalizeRoleAbilities(value: unknown): RoleNightAbility[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const ability = item as Partial<RoleNightAbility>;
      const label = String(ability.label || "").trim();
      if (!label) return null;
      return {
        id: String(ability.id || `ability-${index + 1}`),
        label,
        usesPerGame: typeof ability.usesPerGame === "number" ? ability.usesPerGame : null,
        usesPerNight: typeof ability.usesPerNight === "number" ? ability.usesPerNight : null,
        targetsPerUse: typeof ability.targetsPerUse === "number" ? Math.max(1, Math.min(5, ability.targetsPerUse)) : 1,
        selfTargetLimit: typeof ability.selfTargetLimit === "number" ? Math.max(0, Math.min(5, ability.selfTargetLimit)) : 0,
        effectType: normalizeEffectType(ability.effectType),
        choices: Array.isArray(ability.choices) ? ability.choices : [],
      };
    })
    .filter(Boolean) as RoleNightAbility[];
}

function normalizeActiveRoleAbilityConfig(value: unknown): ActiveRoleAbilityConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<ActiveRoleAbilityConfig>((config, [roleId, abilityIds]) => {
    if (!Array.isArray(abilityIds)) return config;
    config[roleId] = abilityIds.map((item) => String(item || "").trim()).filter(Boolean);
    return config;
  }, {});
}

function defaultAbilityConfigForScenario(scenario: any): ActiveRoleAbilityConfig {
  const roles = Array.isArray(scenario?.roles) ? scenario.roles : [];
  return roles.reduce((config: ActiveRoleAbilityConfig, item: any) => {
    const abilities = normalizeRoleAbilities(item.role?.nightAbilities);
    if (abilities.length === 1) config[item.roleId] = [abilities[0].id];
    if (abilities.length > 1) config[item.roleId] = [];
    return config;
  }, {});
}

function abilityConfigForGame(game: any): ActiveRoleAbilityConfig {
  const existing = normalizeActiveRoleAbilityConfig(game?.activeRoleAbilities);
  return Object.keys(existing).length > 0 ? existing : defaultAbilityConfigForScenario(game?.scenario);
}

function abilityLimitLabel(ability: RoleNightAbility) {
  const targetCount = ability.targetsPerUse || 1;
  const selfLimit = ability.selfTargetLimit ?? 0;
  const storedEffectType = normalizeEffectType(ability.effectType);
  const effectType = storedEffectType !== "NONE" ? storedEffectType : inferEffectTypeFromLabel(ability.label);
  const parts = [
    ability.usesPerGame ? `فقط ${ability.usesPerGame} شب در کل بازی` : "قابل استفاده در هر شب",
    targetCount > 1 ? `هر ثبت شامل ${targetCount} هدف/گزینه` : "هر ثبت روی ۱ هدف",
  ];
  parts.push(selfLimit > 0 ? `روی خودش تا ${selfLimit} بار` : "روی خودش مجاز نیست");
  if (effectType !== "NONE") parts.push(`رفتار گزارش: ${effectLabel(effectType)}`);
  if (ability.choices.length) parts.push(`${ability.choices.length} نام برای هدف‌ها`);
  return parts.join("، ");
}

export default function GameLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { showAlert, showConfirm, showToast } = usePopup();
  const gameId = params.id as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingScenario, setSettingScenario] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRoles, setCustomRoles] = useState<{ roleId: string; count: number }[]>([]);
  const [customRoleSearch, setCustomRoleSearch] = useState("");
  const [saveCustomScenario, setSaveCustomScenario] = useState(false);
  const [customScenarioName, setCustomScenarioName] = useState("");
  const [abilityConfig, setAbilityConfig] = useState<ActiveRoleAbilityConfig>({});
  const [savingAbilities, setSavingAbilities] = useState(false);
  const [busyPlayerId, setBusyPlayerId] = useState<string | null>(null);
  const [deletingLobby, setDeletingLobby] = useState(false);
  const [savingTelegramJoin, setSavingTelegramJoin] = useState(false);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    let mounted = true;
    let pusher: ReturnType<typeof getPusherClient> | null = null;

    const loadLobby = async () => {
      try {
        const gameRes = await getGameStatus(gameId);
        if (!mounted) return;

        if (!gameRes) {
          router.replace("/dashboard/moderator");
          return;
        }
        if (gameRes.moderatorId !== session?.user?.id) {
          router.replace(gameRes.status === "IN_PROGRESS" ? `/game/${gameId}` : gameRes.status === "WAITING" ? `/lobby/${gameId}` : "/dashboard/user");
          return;
        }
        if (gameRes.status === "IN_PROGRESS") {
          router.replace(`/dashboard/moderator/game/${gameId}`);
          return;
        }
        if (gameRes.status === "FINISHED") {
          router.replace("/dashboard/moderator");
          return;
        }

        const [scenariosRes, rolesRes] = await Promise.all([getScenarios(), getRoles()]);
        if (!mounted) return;

        setGame(gameRes);
        setAbilityConfig(abilityConfigForGame(gameRes));
        setPlayers((gameRes.players || []).map((player: any) => ({ id: player.id, name: player.name, userId: player.userId, image: player.image || player.user?.image || null, isAlive: player.isAlive, joinSource: player.joinSource })));
        setScenarios(scenariosRes);
        setRoles(rolesRes);
        setLoading(false);

        pusher = getPusherClient();
        const channel = pusher.subscribe(`game-${gameId}`);

        channel.bind("player-joined", (data: { player: Player }) => {
          setPlayers((prev) => {
            if (prev.find((player) => player.id === data.player.id)) return prev;
            return [...prev, data.player];
          });
        });

        channel.bind("player-left", (data: { playerId: string }) => {
          setPlayers((prev) => prev.filter((player) => player.id !== data.playerId));
        });

        channel.bind("player-removed", (data: { playerId: string }) => {
          setPlayers((prev) => prev.filter((player) => player.id !== data.playerId));
        });

        channel.bind("scenario-updated", (data: { scenario: any; activeRoleAbilities?: unknown }) => {
          setGame((prev: any) => (prev ? { ...prev, scenario: data.scenario, activeRoleAbilities: data.activeRoleAbilities ?? prev.activeRoleAbilities } : prev));
          if ("activeRoleAbilities" in data) {
            setAbilityConfig(normalizeActiveRoleAbilityConfig(data.activeRoleAbilities));
          } else if (data.scenario) {
            setAbilityConfig(defaultAbilityConfigForScenario(data.scenario));
          }
        });

        channel.bind("ability-config-updated", (data: { activeRoleAbilities?: unknown }) => {
          setGame((prev: any) => (prev ? { ...prev, activeRoleAbilities: data.activeRoleAbilities ?? null } : prev));
          setAbilityConfig(normalizeActiveRoleAbilityConfig(data.activeRoleAbilities));
        });

        channel.bind("telegram-join-updated", (data: { telegramJoinEnabled: boolean }) => {
          setGame((prev: any) => (prev ? { ...prev, telegramJoinEnabled: data.telegramJoinEnabled } : prev));
        });
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        showAlert("خطا", "لابی بارگذاری نشد. اتصال سرور یا دیتابیس را بررسی کنید.", "error");
        setLoading(false);
      }
    };

    loadLobby();

    return () => {
      mounted = false;
      pusher?.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, router, session?.user?.id, sessionStatus, showAlert]);

  const requiredPlayers = useMemo(
    () => game?.scenario?.roles?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
    [game]
  );

  const recommendedScenarios = useMemo(
    () =>
      scenarios.filter((scenario) => {
        const count = scenario.roles.reduce((sum: number, item: any) => sum + item.count, 0);
        return count === players.length;
      }),
    [players.length, scenarios]
  );

  const scenarioRoles = useMemo(
    () =>
      (game?.scenario?.roles || []).map((item: any) => ({
        roleId: item.roleId,
        name: item.role?.name || "نقش",
        alignment: item.role?.alignment,
        count: item.count,
      })),
    [game]
  );

  const scenarioAbilityRoles = useMemo<ScenarioAbilityRole[]>(
    () =>
      (game?.scenario?.roles || [])
        .map((item: any) => ({
          roleId: item.roleId,
          name: item.role?.name || "نقش",
          alignment: item.role?.alignment,
          count: item.count,
          abilities: normalizeRoleAbilities(item.role?.nightAbilities),
        }))
        .filter((item: ScenarioAbilityRole) => item.abilities.length > 0),
    [game]
  );

  const missingAbilityRoleNames = scenarioAbilityRoles
    .filter((item) => item.abilities.length > 1 && (abilityConfig[item.roleId]?.length || 0) === 0)
    .map((item) => item.name);

  const lobbyPlayers = useMemo(
    () =>
      players.map((player) => ({
        id: player.id,
        name: player.name,
        userId: player.userId,
        image: player.image || null,
        isAlive: player.isAlive,
      })),
    [players]
  );

  const filteredCustomRoles = useMemo(() => {
    const query = normalizeSearchText(customRoleSearch);
    const roleCountMap = new Map(customRoles.map((role) => [role.roleId, role.count]));
    const visibleRoles = query
      ? roles.filter((role) => normalizeSearchText(role.name).includes(query))
      : roles;

    return [...visibleRoles].sort((left, right) => {
      const leftCount = roleCountMap.get(left.id) || 0;
      const rightCount = roleCountMap.get(right.id) || 0;
      if (leftCount !== rightCount) return rightCount - leftCount;
      return left.name.localeCompare(right.name, "fa");
    });
  }, [customRoleSearch, customRoles, roles]);

  const selectedCustomCount = customRoles.reduce((sum, item) => sum + item.count, 0);
  const customScenarioDelta = selectedCustomCount - players.length;
  const customScenarioStatus = selectedCustomCount === 0
    ? "هیچ نقشی انتخاب نشده"
    : customScenarioDelta === 0
      ? "هماهنگ با بازیکنان حاضر"
      : customScenarioDelta > 0
        ? `${customScenarioDelta} نقش بیشتر از بازیکنان`
        : `${Math.abs(customScenarioDelta)} نقش کمتر از بازیکنان`;
  const seatsRemaining = requiredPlayers ? requiredPlayers - players.length : 0;
  const activeScenarioCounts = scenarioCounts(game?.scenario);
  const capacityProgress = requiredPlayers ? Math.min(100, Math.round((players.length / requiredPlayers) * 100)) : 0;
  const lobbyCapacity = Math.max(requiredPlayers || players.length || 6, players.length);
  const lobbySlots = Array.from({ length: lobbyCapacity }, (_, index) => players[index] || null);
  const nextLobbyAction = !game?.scenario
    ? "سناریو را انتخاب کنید"
    : players.length < requiredPlayers
      ? `${requiredPlayers - players.length} بازیکن دیگر لازم است`
      : players.length > requiredPlayers
        ? "سناریوی بزرگ‌تر لازم است"
        : missingAbilityRoleNames.length > 0
          ? "توانایی نقش‌ها را نهایی کنید"
          : "آماده شروع بازی";
  const startDisabledReason = !game?.scenario
    ? "برای شروع بازی ابتدا سناریو را انتخاب کنید."
    : players.length < requiredPlayers
      ? `${requiredPlayers - players.length} بازیکن دیگر برای این سناریو لازم است.`
      : players.length > requiredPlayers
        ? "تعداد بازیکنان از ظرفیت سناریو بیشتر است."
        : missingAbilityRoleNames.length > 0
          ? `توانایی فعال ${missingAbilityRoleNames.slice(0, 2).join("، ")} را برای این بازی انتخاب کنید.`
          : "";

  const handleSelectScenario = async (scenarioId: string) => {
    setSettingScenario(true);
    const res = await setGameScenario(gameId, scenarioId);
    if (!res.success) {
      showAlert("خطا", res.error || "خطا در تنظیم سناریو", "error");
    } else {
      const updatedGame = await getGameStatus(gameId);
      setGame(updatedGame);
      setAbilityConfig(abilityConfigForGame(updatedGame));
      showToast(scenarioId ? "سناریو با موفقیت انتخاب شد" : "سناریو برداشته شد", "success");
    }
    setSettingScenario(false);
  };

  const handleStartGame = async () => {
    setLoading(true);
    const res = await startGame(gameId);
    if (res.success) {
      router.push(`/dashboard/moderator/game/${gameId}`);
    } else {
      showAlert("خطا در شروع بازی", res.error || "خطای نامشخص", "error");
      setLoading(false);
    }
  };

  const handleDeleteLobby = () => {
    showConfirm(
      "حذف لابی",
      "این لابی قبل از شروع بازی حذف می‌شود و همه بازیکنان از اتاق انتظار خارج می‌شوند. ادامه می‌دهید؟",
      async () => {
        setDeletingLobby(true);
        const res = await cancelGame(gameId);
        if (res.success) {
          showToast("لابی حذف شد", "success");
          router.replace("/dashboard/moderator");
        } else {
          showAlert("حذف لابی انجام نشد", res.error || "لطفاً دوباره تلاش کنید.", "error");
          setDeletingLobby(false);
        }
      },
      "error"
    );
  };

  const handleRemovePlayer = (player: Player, blockFromGame: boolean) => {
    if (blockFromGame && player.userId === session?.user?.id) {
      showAlert("محدودسازی ممکن نیست", "نمی‌توانید حساب خودتان را از همین لابی مسدود کنید.", "warning");
      return;
    }

    showConfirm(
      blockFromGame ? "حذف و محدودسازی بازیکن" : "حذف بازیکن از لابی",
      blockFromGame
        ? `${player.name} از لابی حذف می‌شود و دیگر نمی‌تواند به همین بازی برگردد.`
        : `${player.name} از لابی حذف می‌شود، اما در صورت نیاز می‌تواند دوباره وارد همین بازی شود.`,
      async () => {
        setBusyPlayerId(player.id);
        const res = await removeWaitingLobbyPlayer(gameId, player.id, blockFromGame);
        if (res.success) {
          setPlayers((previous) => previous.filter((item) => item.id !== player.id));
          showToast(blockFromGame ? "بازیکن حذف و برای این بازی محدود شد" : "بازیکن از لابی حذف شد", "success");
        } else {
          showAlert("حذف بازیکن انجام نشد", res.error || "لطفاً دوباره تلاش کنید.", "error");
        }
        setBusyPlayerId(null);
      },
      blockFromGame ? "error" : "warning"
    );
  };

  const handleToggleTelegramJoin = async () => {
    const nextValue = !game?.telegramJoinEnabled;
    setSavingTelegramJoin(true);
    const res = await setTelegramJoinEnabled(gameId, nextValue);
    if (res.success) {
      setGame((previous: any) => (previous ? { ...previous, telegramJoinEnabled: res.telegramJoinEnabled } : previous));
      showToast(nextValue ? "ورود از تلگرام فعال شد" : "ورود از تلگرام غیرفعال شد", "success");
    } else {
      showAlert("ورود از تلگرام", res.error || "تغییر وضعیت انجام نشد.", "error");
    }
    setSavingTelegramJoin(false);
  };

  const handleCustomRoleChange = (roleId: string, delta: number) => {
    setCustomRoles((prev) => {
      const existing = prev.find((role) => role.roleId === roleId);
      if (!existing && delta > 0) return [...prev, { roleId, count: 1 }];
      if (!existing) return prev;

      const newCount = Math.max(0, existing.count + delta);
      if (newCount === 0) return prev.filter((role) => role.roleId !== roleId);
      return prev.map((role) => (role.roleId === roleId ? { ...role, count: newCount } : role));
    });
  };

  const handleCreateCustomScenario = async () => {
    if (selectedCustomCount === 0) {
      showAlert("سناریوی سفارشی", "حداقل یک نقش برای این سناریو انتخاب کنید.", "warning");
      return;
    }

    if (saveCustomScenario && !customScenarioName.trim()) {
      showAlert("نام سناریو", "برای ذخیره در کتابخانه، یک نام کوتاه و مشخص وارد کنید.", "warning");
      return;
    }

    if (selectedCustomCount !== players.length) {
      showAlert("تعداد نقش‌ها", `تعداد نقش‌ها (${selectedCustomCount}) باید با تعداد بازیکنان حاضر (${players.length}) برابر باشد.`, "warning");
      return;
    }

    const shouldSaveScenario = saveCustomScenario;
    setSettingScenario(true);
    const res = await createCustomGameScenario(gameId, customRoles, saveCustomScenario, customScenarioName);
    if (!res.success) {
      showAlert("خطا", res.error || "خطا در ایجاد سناریو سفارشی", "error");
    } else {
      const updatedGame = await getGameStatus(gameId);
      setGame(updatedGame);
      setAbilityConfig(abilityConfigForGame(updatedGame));
      if (shouldSaveScenario) {
        const nextScenarios = await getScenarios();
        setScenarios(nextScenarios);
      }
      setShowCustomModal(false);
      setCustomRoleSearch("");
      setSaveCustomScenario(false);
      setCustomScenarioName("");
      const hasConfigurableAbilities = (updatedGame?.scenario?.roles || []).some((item: any) => normalizeRoleAbilities(item.role?.nightAbilities).length > 1);
      showToast(
        hasConfigurableAbilities
          ? "سناریو اعمال شد؛ توانایی‌های فعال همین بازی را انتخاب کنید."
          : shouldSaveScenario
            ? "سناریوی سفارشی ذخیره و اعمال شد"
            : "سناریوی سفارشی اعمال شد",
        "success"
      );
    }
    setSettingScenario(false);
  };

  const toggleAbilityForRole = (roleId: string, abilityId: string) => {
    setAbilityConfig((previous) => {
      const current = previous[roleId] || [];
      const next = current.includes(abilityId)
        ? current.filter((item) => item !== abilityId)
        : [...current, abilityId];
      return { ...previous, [roleId]: next };
    });
  };

  const handleSaveAbilityConfig = async () => {
    setSavingAbilities(true);
    const res = await setGameRoleAbilities(gameId, abilityConfig);
    if (res.success) {
      setAbilityConfig(normalizeActiveRoleAbilityConfig(res.activeRoleAbilities));
      setGame((previous: any) => (previous ? { ...previous, activeRoleAbilities: res.activeRoleAbilities } : previous));
      showToast("توانایی‌های این بازی ذخیره شد", "success");
    } else {
      showAlert("خطا", res.error || "ذخیره توانایی‌ها انجام نشد", "error");
    }
    setSavingAbilities(false);
  };

  const copyJoinLink = async () => {
    const link = `${window.location.origin}/lobby/${gameId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("لینک ورود کپی شد", "success");
    } catch {
      showAlert("کپی لینک", link, "info");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[560px] items-center justify-center" dir="rtl">
        <div className="pm-card w-full max-w-xl overflow-hidden text-center">
          <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-300" />
          <div className="p-8 sm:p-10">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--pm-primary)] text-[var(--pm-text-inverse)] shadow-lg shadow-[var(--pm-primary)]/20">
              <span className="material-symbols-outlined animate-spin text-3xl leading-none">progress_activity</span>
            </div>
            <p className="mt-5 text-lg font-black text-[var(--pm-text)]">در حال آماده‌سازی اتاق انتظار</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--pm-muted)]">
              بازیکنان، سناریو و تنظیمات شروع بازی در حال هماهنگ‌سازی هستند.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <section className="relative overflow-hidden rounded-lg border border-[var(--pm-line)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_54%,#edf4e6_100%)] shadow-xl shadow-zinc-950/10 dark:border-[var(--pm-line)] dark:bg-[linear-gradient(135deg,rgba(17,20,23,0.94)_0%,rgba(21,24,27,0.98)_58%,rgba(190,242,100,0.22)_100%)] dark:shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
        <header className="relative overflow-hidden border-b border-[var(--pm-line)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#edf4e6_100%)] p-4 text-zinc-950 dark:border-[var(--pm-line)] dark:bg-[linear-gradient(135deg,rgba(17,20,23,0.96)_0%,rgba(21,24,27,0.98)_58%,rgba(190,242,100,0.2)_100%)] dark:text-white sm:p-5">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(132,204,22,0.12),transparent_44%),linear-gradient(90deg,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:auto,2.75rem_2.75rem] dark:bg-[linear-gradient(135deg,rgba(190,242,100,0.16),transparent_44%),linear-gradient(90deg,rgba(96,165,250,0.08)_1px,transparent_1px)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pm-primary)]">مدیریت لابی</p>
              <h1 className="mt-1 line-clamp-2 break-words text-2xl font-black leading-8 sm:text-3xl sm:leading-10">{game?.name || "لابی بازی مافیا"}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                <span className="rounded-lg border border-[var(--pm-line)] bg-white/82 px-2.5 py-1 text-[var(--pm-muted)] shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-white/10 dark:text-zinc-200">{players.length} بازیکن حاضر</span>
                <span className="rounded-lg border border-[var(--pm-line)] bg-white/82 px-2.5 py-1 text-[var(--pm-muted)] shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-white/10 dark:text-zinc-200">{requiredPlayers || "بدون"} ظرفیت سناریو</span>
                <span className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2.5 py-1 text-[var(--pm-primary-strong)] shadow-sm shadow-[var(--pm-primary)]/10 dark:border-[var(--pm-primary)]/30 dark:bg-[var(--pm-primary)]/10 dark:text-[var(--pm-primary)]">کد #{game?.code || "------"}</span>
                <span className={game?.telegramJoinEnabled ? "rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sky-700 shadow-sm shadow-sky-500/10 dark:text-sky-300" : "rounded-lg border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-1 text-[var(--pm-muted)]"}>
                  تلگرام {game?.telegramJoinEnabled ? "فعال" : "خاموش"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button onClick={copyJoinLink} className="pm-button-secondary min-h-10 border-[var(--pm-line)] bg-white/82 px-3 text-xs text-zinc-700 shadow-sm shadow-zinc-950/5 hover:border-[var(--pm-primary)]/30 hover:bg-[var(--pm-primary)]/10 hover:text-zinc-950 dark:border-[var(--pm-line)] dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-zinc-950">
                <span className="material-symbols-outlined text-base">content_copy</span>
                کپی لینک
              </button>
              <button
                onClick={handleDeleteLobby}
                disabled={deletingLobby}
                className="pm-button-danger min-h-10 px-3 text-xs"
              >
                <span className={`material-symbols-outlined text-base ${deletingLobby ? "animate-spin" : ""}`}>{deletingLobby ? "progress_activity" : "delete"}</span>
                حذف لابی
              </button>
              <button onClick={() => router.push("/dashboard/moderator")} className="pm-button-secondary min-h-10 border-[var(--pm-line)] bg-white/82 px-3 text-xs text-zinc-700 shadow-sm shadow-zinc-950/5 hover:border-[var(--pm-primary)]/30 hover:bg-[var(--pm-primary)]/10 hover:text-zinc-950 dark:border-[var(--pm-line)] dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-zinc-950">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
                بازگشت
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                { icon: "groups", label: "بازیکنان", value: players.length > 0 ? "فعال" : "در انتظار", done: players.length > 0 },
                { icon: "account_tree", label: "سناریو", value: game?.scenario ? "انتخاب شد" : "لازم است", done: Boolean(game?.scenario) },
                { icon: "tune", label: "توانایی‌ها", value: missingAbilityRoleNames.length ? "نیاز به انتخاب" : "هماهنگ", done: missingAbilityRoleNames.length === 0 },
                { icon: "play_arrow", label: "شروع", value: startDisabledReason ? "قفل" : "آماده", done: !startDisabledReason },
              ].map((step) => (
                <div key={step.label} className={`rounded-lg border p-3 shadow-sm shadow-zinc-950/5 ${step.done ? "border-[var(--pm-primary)]/25 bg-[var(--pm-primary)]/10" : "border-[var(--pm-line)] bg-white/80 dark:border-[var(--pm-line)] dark:bg-white/[0.03]"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`material-symbols-outlined text-xl ${step.done ? "text-[var(--pm-primary)] dark:text-[var(--pm-primary)]" : "text-[var(--pm-muted)]"}`}>{step.icon}</span>
                    <span className={step.done ? "rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2 py-0.5 text-[10px] font-black text-[var(--pm-primary)]" : "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300"}>
                      {step.value}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-black text-[var(--pm-text)]">{step.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <section className="overflow-hidden rounded-lg border border-[var(--pm-line)] bg-white/90 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/65">
                <div className="flex flex-col gap-3 border-b border-[var(--pm-line)] bg-zinc-50/80 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">لیست زنده بازیکنان</p>
                    <h2 className="mt-1 text-lg font-black text-[var(--pm-text)]">آمادگی لابی و ظرفیت</h2>
                  </div>
                  <span className={`rounded-lg border px-3 py-1 text-xs font-black ${
                    !requiredPlayers
                      ? "border-[var(--pm-line)] bg-white text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-[var(--pm-muted)]"
                      : seatsRemaining === 0
                        ? "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]"
                        : seatsRemaining > 0
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"
                  }`}>
                    {nextLobbyAction}
                  </span>
                </div>

                <div className="p-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {lobbySlots.map((player, index) => {
                      const image = player?.image || null;
                      const joinedViaTelegram = player?.joinSource === "TELEGRAM";
                      return (
                        <div
                          key={player?.id || `slot-${index}`}
                          className={`flex min-h-14 items-center gap-3 rounded-lg border p-2.5 transition-all ${
                            player
                              ? joinedViaTelegram
                                ? "border-sky-500/25 bg-sky-500/10 shadow-sm shadow-sky-500/10"
                                : "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 shadow-sm shadow-lime-500/10"
                              : "border-dashed border-[var(--pm-line)] bg-zinc-50/70 dark:border-[var(--pm-line)] dark:bg-white/[0.03]"
                          }`}
                        >
                          <span className={`relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-black ${
                            player ? joinedViaTelegram ? "bg-sky-500 text-white" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-zinc-300 dark:bg-zinc-950 dark:text-[var(--pm-muted)]"
                          }`}>
                            {player ? image ? <img src={image} alt="" className="size-full object-cover" /> : player.name.slice(0, 1) : <span className="material-symbols-outlined text-xl">person_add</span>}
                            {joinedViaTelegram && <span className="material-symbols-outlined absolute -bottom-1 -right-1 rounded-full bg-white text-[13px] text-sky-600">send</span>}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-1">
                              <span className={`block truncate text-sm font-black ${player ? joinedViaTelegram ? "text-sky-700 dark:text-sky-300" : "text-[var(--pm-text)]" : "text-[var(--pm-muted)]"}`}>
                                {player?.name || `جای خالی ${index + 1}`}
                              </span>
                              {joinedViaTelegram && <span className="rounded-md bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">TG</span>}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] font-bold text-[var(--pm-muted)]">
                              {player ? joinedViaTelegram ? "ورود از تلگرام" : "وارد لابی شده" : requiredPlayers ? "در انتظار بازیکن" : "بعد از انتخاب سناریو فعال می‌شود"}
                            </span>
                            {player && (
                              <span className="mt-2 grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePlayer(player, false)}
                                  disabled={busyPlayerId === player.id}
                                  className="min-h-8 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 text-[10px] font-black text-amber-700 transition-all hover:bg-amber-500/18 disabled:opacity-50 dark:text-amber-300"
                                >
                                  حذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePlayer(player, true)}
                                  disabled={busyPlayerId === player.id || player.userId === session?.user?.id}
                                  className="min-h-8 rounded-lg border border-red-500/20 bg-red-500/10 px-2 text-[10px] font-black text-red-600 transition-all hover:bg-red-500/18 disabled:opacity-50 dark:text-red-300"
                                >
                                  حذف و بستن
                                </button>
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <aside className="rounded-lg border border-[var(--pm-line)] bg-white/90 p-4 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/65">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">کنترل سریع</p>
                    <h2 className="mt-1 text-lg font-black text-[var(--pm-text)]">دعوت و شروع</h2>
                  </div>
                  <span className="material-symbols-outlined flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-xl text-white dark:bg-white dark:text-zinc-950">admin_panel_settings</span>
                </div>

                <div className="mt-4 rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                  <p className="text-[10px] font-black text-[var(--pm-muted)]">کد ورود</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-3xl font-black tracking-[0.25em] text-[var(--pm-text)]">{game?.code || "------"}</span>
                    <button type="button" onClick={copyJoinLink} className="pm-button-secondary min-h-10 px-3 text-xs">
                      <span className="material-symbols-outlined text-base">content_copy</span>
                      لینک
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--pm-text)]">ورود از تلگرام</p>
                      <p className="mt-1 text-[10px] font-bold leading-5 text-sky-700 dark:text-sky-300">
                        فقط کاربران لینک‌شده می‌توانند از ربات وارد شوند.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleTelegramJoin}
                      disabled={savingTelegramJoin}
                      className={`min-h-10 shrink-0 rounded-lg border px-3 text-[10px] font-black transition-all disabled:opacity-60 ${
                        game?.telegramJoinEnabled
                          ? "border-sky-500/30 bg-sky-500 text-white"
                          : "border-[var(--pm-line)] bg-white text-[var(--pm-muted)] dark:bg-zinc-950"
                      }`}
                    >
                      <span className={`material-symbols-outlined align-middle text-base ${savingTelegramJoin ? "animate-spin" : ""}`}>
                        {savingTelegramJoin ? "progress_activity" : game?.telegramJoinEnabled ? "toggle_on" : "toggle_off"}
                      </span>
                      {game?.telegramJoinEnabled ? "فعال" : "خاموش"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    ["حاضر", players.length, "text-[var(--pm-primary)] dark:text-[var(--pm-primary)]"],
                    ["ظرفیت", requiredPlayers || "?", "text-sky-600 dark:text-sky-300"],
                    ["مانده", requiredPlayers ? Math.max(0, seatsRemaining) : "?", "text-amber-600 dark:text-amber-300"],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-2 text-center dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                      <p className={`text-lg font-black ${color}`}>{value}</p>
                      <p className="mt-0.5 text-[9px] font-bold text-[var(--pm-muted)]">{label}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              {game?.scenario ? (
                <div className="relative overflow-hidden rounded-lg border border-[var(--pm-primary)]/20 bg-white/90 p-4 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--pm-primary)]">سناریوی فعال</p>
                      <p className="mt-1 line-clamp-2 break-words text-xl font-black leading-7 text-[var(--pm-text)]">{game.scenario.name}</p>
                      <p className="mt-1 text-sm font-bold text-[var(--pm-primary)]">{players.length} / {requiredPlayers} بازیکن</p>
                    </div>
                    <button onClick={() => handleSelectScenario("")} className="pm-button-secondary min-h-9 shrink-0 px-3 text-xs" disabled={settingScenario}>
                      تغییر
                    </button>
                  </div>
                  <div className="mt-4 rounded-lg border border-[var(--pm-line)] bg-zinc-50/80 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                    <div className="flex h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                      {[
                        ["bg-sky-500", activeScenarioCounts.CITIZEN],
                        ["bg-red-500", activeScenarioCounts.MAFIA],
                        ["bg-amber-500", activeScenarioCounts.NEUTRAL],
                      ].map(([className, value]) => (
                        Number(value) > 0 && (
                          <span key={String(className)} className={String(className)} style={{ width: `${activeScenarioCounts.total ? Math.max(6, (Number(value) / activeScenarioCounts.total) * 100) : 0}%` }} />
                        )
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        ["شهروند", activeScenarioCounts.CITIZEN, "text-sky-600 dark:text-sky-300"],
                        ["مافیا", activeScenarioCounts.MAFIA, "text-red-600 dark:text-red-300"],
                        ["مستقل", activeScenarioCounts.NEUTRAL, "text-amber-600 dark:text-amber-300"],
                      ].map(([label, value, color]) => (
                        <div key={String(label)} className="rounded-lg bg-white px-2 py-1.5 text-center dark:bg-zinc-950/60">
                          <p className={`text-sm font-black ${color}`}>{value}</p>
                          <p className="mt-0.5 text-[9px] font-bold text-[var(--pm-muted)]">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--pm-line)] bg-white/70 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                  <span className="material-symbols-outlined text-4xl text-[var(--pm-muted)]">account_tree</span>
                  <p className="mt-3 text-lg font-black text-[var(--pm-text)]">سناریو انتخاب نشده</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--pm-muted)]">یک سناریوی آماده انتخاب کنید یا ترکیب مخصوص همین لابی را بچینید.</p>
                </div>
              )}

              <div className="rounded-lg border border-[var(--pm-line)] bg-white/85 p-4 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[var(--pm-muted)]">انتخاب سناریو</p>
                    <p className="mt-1 text-sm font-bold text-[var(--pm-text)]">کتابخانه یا طراحی لحظه‌ای</p>
                  </div>
                  <span className="material-symbols-outlined text-[var(--pm-muted)]">rule_settings</span>
                </div>
                <label className="mt-4 flex flex-col gap-2">
                  <span className="text-xs font-black text-[var(--pm-muted)]">انتخاب از کتابخانه</span>
                  <select onChange={(event) => handleSelectScenario(event.target.value)} value="" disabled={settingScenario}>
                    <option value="">انتخاب سناریو...</option>
                    {scenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.name} ({scenario.roles.reduce((sum: number, item: any) => sum + item.count, 0)} نفره)
                      </option>
                    ))}
                  </select>
                </label>

                <MobilePwaFeatureLock
                  compact
                  icon="dashboard_customize"
                  title="طراحی سناریوی لحظه‌ای"
                  description="ساخت سناریوی سفارشی در همین لابی فعال است."
                >
                  <button
                    onClick={() => {
                      setCustomRoleSearch("");
                      setSaveCustomScenario(false);
                      setCustomScenarioName("");
                      setShowCustomModal(true);
                    }}
                    disabled={settingScenario}
                    className="pm-button-secondary mt-3 min-h-12 w-full"
                  >
                    <span className="material-symbols-outlined text-xl">dashboard_customize</span>
                    طراحی سناریو در لحظه
                  </button>
                </MobilePwaFeatureLock>
              </div>
            </div>

            {players.length > 0 && recommendedScenarios.length > 0 && !game?.scenario && (
              <div>
                <p className="mb-2 text-xs font-black text-[var(--pm-muted)]">پیشنهاد مناسب تعداد فعلی</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {recommendedScenarios.slice(0, 3).map((scenario) => {
                    const counts = scenarioCounts(scenario);
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => handleSelectScenario(scenario.id)}
                        disabled={settingScenario}
                        className="group relative overflow-hidden rounded-lg border border-[var(--pm-primary)]/25 bg-white/90 p-3 text-right shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/40 hover:shadow-lg hover:shadow-zinc-950/10 disabled:opacity-50 dark:bg-zinc-950/70"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 to-sky-400" />
                        <p className="mt-1 line-clamp-2 break-words font-black leading-6 text-[var(--pm-text)]">{scenario.name}</p>
                        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-black text-[var(--pm-muted)]">
                          <span>{counts.total} نفره</span>
                          <span>{scenario.roles.length} نوع نقش</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          {[
                            ["شهر", counts.CITIZEN, "text-sky-600 dark:text-sky-300"],
                            ["مافیا", counts.MAFIA, "text-red-600 dark:text-red-300"],
                            ["مستقل", counts.NEUTRAL, "text-amber-600 dark:text-amber-300"],
                          ].map(([label, value, color]) => (
                            <span key={String(label)} className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-1.5 py-1 text-center dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                              <span className={`block text-xs ${color}`}>{value}</span>
                              <span className="block text-[8px] text-[var(--pm-muted)]">{label}</span>
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit space-y-3 rounded-lg border border-[var(--pm-line)] bg-white/90 p-4 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/70 xl:sticky xl:top-5">
            <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-3 text-xs font-black text-[var(--pm-muted)]">
                <span>آمادگی شروع</span>
                <span className="text-[var(--pm-text)]">{capacityProgress}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" style={{ width: `${capacityProgress}%` }} />
              </div>
            </div>
            <button
              onClick={handleStartGame}
              disabled={Boolean(startDisabledReason) || loading}
              className="pm-button-primary min-h-12 w-full text-base"
            >
              <span className="material-symbols-outlined text-xl">play_arrow</span>
              شروع بازی
            </button>
            {startDisabledReason ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-bold leading-6 text-amber-700 dark:text-amber-300">
                {startDisabledReason}
              </p>
            ) : (
              <p className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-3 text-sm font-bold leading-6 text-[var(--pm-primary)]">
                همه چیز برای شروع آماده است.
              </p>
            )}
          </aside>
        </div>
      </section>

      {scenarioAbilityRoles.length > 0 && (
        <MobilePwaFeatureLock
          icon="tune"
          title="تنظیم توانایی‌های بازی"
          description="این بخش برای موبایل و دسکتاپ در دسترس است و کنترل‌ها زیر نوار ناوبری نمی‌روند."
        >
        <section className="pm-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">توانایی‌های همین بازی</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">انتخاب اکشن‌های فعال سناریو</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--pm-muted)]">
                نقش‌هایی که چند توانایی دارند، فقط با انتخاب شما در اتاق شب ظاهر می‌شوند.
              </p>
            </div>
            <button onClick={handleSaveAbilityConfig} disabled={savingAbilities || settingScenario} className="pm-button-primary min-h-11 px-4 text-sm">
              <span className="material-symbols-outlined text-xl">tune</span>
              ذخیره توانایی‌ها
            </button>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-2 2xl:grid-cols-3">
            {scenarioAbilityRoles.map((role) => {
              const selectedIds = abilityConfig[role.roleId] || [];
              return (
                <article key={role.roleId} className="rounded-lg border border-[var(--pm-line)] bg-white p-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-[var(--pm-text)]">{role.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black">
                        <span className={`rounded-lg border px-2 py-1 ${alignmentClass(role.alignment)}`}>{alignmentLabel(role.alignment)}</span>
                        <span className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2 py-1 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                          {role.count} نقش در سناریو
                        </span>
                      </div>
                    </div>
                    <span className={selectedIds.length > 0 ? "rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2 py-1 text-[10px] font-black text-[var(--pm-primary)]" : "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300"}>
                      {selectedIds.length || "بدون"} فعال
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {role.abilities.map((ability) => {
                      const active = selectedIds.includes(ability.id);
                      return (
                        <button
                          key={ability.id}
                          type="button"
                          onClick={() => toggleAbilityForRole(role.roleId, ability.id)}
                          className={`rounded-lg border p-3 text-right transition-all ${
                            active
                              ? "border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/10 shadow-sm shadow-[var(--pm-primary)]/10"
                              : "border-[var(--pm-line)] bg-zinc-50 hover:border-zinc-300 dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-[var(--pm-text)]">{ability.label}</p>
                              <p className="mt-1 text-xs leading-5 text-[var(--pm-muted)]">{abilityLimitLabel(ability)}</p>
                            </div>
                            <span className={`material-symbols-outlined text-xl ${active ? "text-[var(--pm-primary)] dark:text-[var(--pm-primary)]" : "text-zinc-300 dark:text-[var(--pm-muted)]"}`}>
                              {active ? "check_circle" : "radio_button_unchecked"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        </MobilePwaFeatureLock>
      )}

      <LobbyPreviewCard
        title={game?.name || "لابی بازی مافیا"}
        subtitle="نمای بازیکنان، ظرفیت و ترکیب سناریوی انتخاب‌شده."
        scenarioName={game?.scenario?.name || "سناریوی تعیین نشده"}
        code={game?.code || "------"}
        statusLabel={seatsRemaining <= 0 && requiredPlayers ? "آماده شروع" : "در حال تکمیل"}
        playerCount={players.length}
        capacity={requiredPlayers}
        moderatorName={game?.moderator?.name || "گرداننده"}
        locked={game?.hasPassword}
        players={lobbyPlayers}
        roleBreakdown={scenarioRoles}
      />

      {showCustomModal && typeof document !== "undefined" && createPortal(
        <div className="pm-modal-layer fixed inset-0 z-[520] flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] backdrop-blur-xl md:items-center md:pb-3">
          <div className="pm-card pm-safe-modal flex max-h-[calc(100dvh-7rem)] w-full flex-col overflow-hidden rounded-lg md:max-h-[calc(100dvh-1.5rem)] md:max-w-6xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--pm-line)] bg-zinc-50/90 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03] sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">سناریوی سفارشی</p>
                <h2 className="mt-1 text-xl font-black text-[var(--pm-text)] sm:text-2xl">چیدن نقش‌ها</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                  <span className="rounded-lg border border-[var(--pm-line)] bg-white px-2.5 py-1 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-300">
                    {selectedCustomCount} / {players.length} نقش
                  </span>
                  <span className={`rounded-lg border px-2.5 py-1 ${
                    selectedCustomCount > 0 && customScenarioDelta === 0
                      ? "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}>
                    {customScenarioStatus}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomRoleSearch("");
                  setSaveCustomScenario(false);
                  setCustomScenarioName("");
                }}
                className="pm-button-secondary size-10 p-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="space-y-4">
                <section className="min-w-0">
                  <label className="sticky top-0 z-10 mb-4 flex min-h-12 items-center gap-3 rounded-lg border border-[var(--pm-line)] bg-white px-3 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                    <span className="material-symbols-outlined text-[var(--pm-muted)]">search</span>
                    <input
                      value={customRoleSearch}
                      onChange={(event) => setCustomRoleSearch(event.target.value)}
                      placeholder="جستجوی نام نقش"
                      className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                    />
                  </label>

                  {filteredCustomRoles.length === 0 ? (
                    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--pm-line)] p-8 text-center dark:border-[var(--pm-line)]">
                      <div className="pm-icon size-14">
                        <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">manage_search</span>
                      </div>
                      <p className="text-sm font-bold text-[var(--pm-muted)]">نقشی با این جستجو پیدا نشد.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredCustomRoles.map((role) => {
                        const count = customRoles.find((item) => item.roleId === role.id)?.count || 0;

                        return (
                          <div
                            key={role.id}
                            className={`rounded-lg border p-3 transition-colors ${
                              count > 0
                                ? "border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/10"
                                : "border-[var(--pm-line)] bg-[var(--pm-surface-soft)]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-[var(--pm-text)]">{role.name}</p>
                                <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                                  {alignmentLabel(role.alignment)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[var(--pm-line)] bg-white p-1 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                                <button type="button" onClick={() => handleCustomRoleChange(role.id, -1)} disabled={count === 0} className="flex size-9 items-center justify-center rounded-md hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-white/10">
                                  <span className="material-symbols-outlined text-base">remove</span>
                                </button>
                                <span className="w-6 text-center text-base font-black text-[var(--pm-text)]">{count}</span>
                                <button type="button" onClick={() => handleCustomRoleChange(role.id, 1)} className="flex size-9 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
                                  <span className="material-symbols-outlined text-base">add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className="sticky bottom-0 grid gap-3 border-t border-[var(--pm-line)] bg-white p-4 pb-[max(env(safe-area-inset-bottom),1rem)] dark:border-[var(--pm-line)] dark:bg-zinc-900/95 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                saveCustomScenario
                  ? "border-[var(--pm-primary)]/35 bg-[var(--pm-primary)]/10 shadow-sm shadow-[var(--pm-primary)]/10"
                  : "border-[var(--pm-line)] bg-zinc-50 hover:border-[var(--pm-primary)]/25 dark:border-[var(--pm-line)] dark:bg-white/[0.03]"
              }`}>
                <input
                  type="checkbox"
                  checked={saveCustomScenario}
                  onChange={(event) => setSaveCustomScenario(event.target.checked)}
                  className="sr-only"
                />
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg border transition-all ${
                  saveCustomScenario
                    ? "border-[var(--pm-primary)] bg-gradient-to-br from-lime-300 to-lime-500 text-zinc-950 shadow-sm shadow-[var(--pm-primary)]/30"
                    : "border-zinc-300 bg-white text-zinc-300 dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-700"
                }`}>
                  <span className="material-symbols-outlined text-lg">{saveCustomScenario ? "check" : "add"}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-[var(--pm-text)]">ذخیره در کتابخانه سناریوها</span>
                </span>
              </label>

              {saveCustomScenario && (
                <label className="flex flex-col gap-2 rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-3 sm:col-span-2">
                  <span className="text-xs font-black text-[var(--pm-primary)]">نام سناریو برای کتابخانه</span>
                  <input
                    value={customScenarioName}
                    onChange={(event) => setCustomScenarioName(event.target.value)}
                    maxLength={40}
                    placeholder="مثلاً سناریوی ۱۰ نفره جمعه"
                    className="w-full"
                  />
                </label>
              )}

              <button
                onClick={handleCreateCustomScenario}
                disabled={settingScenario || selectedCustomCount === 0}
                className="pm-button-primary min-h-12 w-full"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                اعمال سناریو ({selectedCustomCount})
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
