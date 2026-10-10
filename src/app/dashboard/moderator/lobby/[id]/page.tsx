"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
import { addGuestPlayer, cancelGame, createCustomGameScenario, getGameStatus, removeWaitingLobbyPlayer, setGameRoleAbilities, setGameScenario, setTelegramJoinEnabled, startGame } from "@/actions/game";
import { getScenarios } from "@/actions/admin";
import { getRoles } from "@/actions/role";
import { ArrowRight, CaretLeft, Check, Copy, GearSix, MagnifyingGlass, Minus, Play, Plus, Prohibit, ShareNetwork, TelegramLogo, Trash, UserMinus, UserPlus } from "@phosphor-icons/react";
import { usePopup } from "@/components/PopupProvider";
import { MaskAvatar, MaskStack } from "@/components/brand/MaskAvatar";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { FactionTag } from "@/components/ui/Tag";
import { assignTableHues } from "@/lib/playerColor";

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

const toFa = (value: number) => value.toLocaleString("fa-IR");
const faDigits = (value: string) => value.replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
const BAR: Record<string, string> = { CITIZEN: "bg-citizen", MAFIA: "bg-mafia", NEUTRAL: "bg-independent" };

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
  const [guestName, setGuestName] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [panel, setPanel] = useState<"scenario" | "players" | "abilities" | "settings" | null>(null);
  const [scenarioSearch, setScenarioSearch] = useState("");

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

  const hues = useMemo(() => assignTableHues(players.map((player) => player.userId || player.id)), [players]);

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
  const activeScenarioCounts = scenarioCounts(game?.scenario);
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

  const handleAddGuest = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = guestName.trim();
    if (!name || addingGuest) return;
    setAddingGuest(true);
    const res = await addGuestPlayer(gameId, name);
    setAddingGuest(false);
    if (res.success && res.playerId) {
      const playerId = res.playerId;
      setPlayers((previous) => (previous.some((item) => item.id === playerId) ? previous : [...previous, { id: playerId, name, userId: null, joinSource: "WEB" } as Player]));
      setGuestName("");
      showToast(`${name} سر میز نشست`, "success");
    } else {
      showToast(res.error || "افزودن مهمان انجام نشد", "error");
    }
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
    const current = abilityConfig[roleId] || [];
    const nextIds = current.includes(abilityId) ? current.filter((item) => item !== abilityId) : [...current, abilityId];
    const next = { ...abilityConfig, [roleId]: nextIds };
    setAbilityConfig(next);
    handleSaveAbilityConfig(next);
  };

  const handleSaveAbilityConfig = async (config: ActiveRoleAbilityConfig) => {
    setSavingAbilities(true);
    const res = await setGameRoleAbilities(gameId, config);
    if (res.success) {
      setAbilityConfig(normalizeActiveRoleAbilityConfig(res.activeRoleAbilities));
      setGame((previous: any) => (previous ? { ...previous, activeRoleAbilities: res.activeRoleAbilities } : previous));
    } else {
      showAlert("خطا", res.error || "ذخیره توانایی‌ها انجام نشد", "error");
    }
    setSavingAbilities(false);
  };

  const [copied, setCopied] = useState(false);
  const closeCustomSheet = () => {
    setShowCustomModal(false);
    setCustomRoleSearch("");
    setSaveCustomScenario(false);
    setCustomScenarioName("");
  };

  const shareLobby = async () => {
    const link = `${window.location.origin}/lobby/${gameId}`;
    const text = `بیا سر میز «${game?.name || "مافیا"}» در نقاب. کد ورود: ${game?.code || ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "نقاب", text, url: link });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${link}`);
      showToast("لینک لابی کپی شد", "success");
    } catch {
      /* share sheet dismissed */
    }
  };

  const copyCode = async () => {
    if (!game?.code) return;
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4" aria-busy="true">
        <div className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
        <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
      </div>
    );
  }

  const seatsLeft = requiredPlayers ? requiredPlayers - players.length : 0;
  const configurableRoles = scenarioAbilityRoles.filter((role) => role.abilities.length > 1);
  const query = normalizeSearchText(scenarioSearch);
  const visibleScenarios = query ? scenarios.filter((scenario) => normalizeSearchText(scenario.name).includes(query)) : scenarios;
  const recommendedIds = new Set(recommendedScenarios.map((scenario) => scenario.id));
  const otherScenarios = visibleScenarios.filter((scenario) => query || !recommendedIds.has(scenario.id));

  const scenarioStep: StepStatus = game?.scenario ? "done" : "todo";
  const playersStep: StepStatus = !game?.scenario ? (players.length ? "neutral" : "todo") : seatsLeft === 0 ? "done" : "todo";
  const abilitiesStep: StepStatus = missingAbilityRoleNames.length ? "todo" : "done";

  const scenarioRow = (scenario: any) => {
    const counts = scenarioCounts(scenario);
    const current = game?.scenario?.id === scenario.id;
    const tooSmall = counts.total > 0 && counts.total < players.length;
    return (
      <li key={scenario.id}>
        <button
          type="button"
          onClick={async () => {
            if (current) return setPanel(null);
            await handleSelectScenario(scenario.id);
            setPanel(null);
          }}
          disabled={settingScenario}
          aria-current={current || undefined}
          className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] p-3 text-right transition-colors ${current ? "bg-accent-soft ring-1 ring-accent/50" : "hover:bg-raised"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold">{scenario.name}</span>
            <span className={`mt-0.5 block text-sm font-medium ${tooSmall ? "text-warning" : "text-muted"}`}>
              {tooSmall
                ? `${toFa(counts.total)} نفره · برای این میز کوچک است`
                : [`${toFa(counts.CITIZEN)} شهروند`, `${toFa(counts.MAFIA)} مافیا`, counts.NEUTRAL ? `${toFa(counts.NEUTRAL)} مستقل` : ""].filter(Boolean).join(" · ")}
            </span>
          </span>
          <FactionBar counts={counts} className="w-16" />
          {current ? <Check size={18} weight="bold" className="shrink-0 text-accent" aria-label="انتخاب‌شده" /> : null}
        </button>
      </li>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 pb-40 md:pb-10">
      <header className="flex items-center justify-between gap-3">
        <Link href="/dashboard/moderator" className="nq-icon-btn" aria-label="بازگشت به لابی‌ها">
          <ArrowRight size={20} weight="bold" aria-hidden />
        </Link>
        <div className="flex gap-2">
          <button type="button" onClick={shareLobby} className="nq-icon-btn" aria-label="دعوت به این لابی">
            <ShareNetwork size={20} weight="bold" aria-hidden />
          </button>
          <button type="button" onClick={() => setPanel("settings")} className="nq-icon-btn" aria-label="تنظیمات میز">
            <GearSix size={20} weight="bold" aria-hidden />
          </button>
        </div>
      </header>

      <section className="nq-khatam -mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-5">
        <h1 className="nq-display text-[2.4rem] leading-[1.15]">{game?.name || "لابی مافیا"}</h1>
        <button type="button" onClick={copyCode} className="mt-4 flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] bg-canvas px-4 py-3 text-right" aria-label="کپی کد ورود">
          <span className="text-sm font-bold text-muted">کد ورود را سر میز بخوانید</span>
          <span className="flex items-center gap-2">
            <span className="text-3xl font-black tracking-[0.16em] text-accent tabular-nums" dir="ltr">
              {faDigits(game?.code || "------")}
            </span>
            {copied ? <Check size={18} weight="bold" className="text-success" aria-hidden /> : <Copy size={18} weight="bold" className="text-muted" aria-hidden />}
          </span>
        </button>
      </section>

      <section aria-labelledby="steps-title" className="flex flex-col gap-3">
        <h2 id="steps-title" className="text-sm font-bold text-muted">
          {startDisabledReason ? "تا شروع بازی" : "همه‌چیز آماده است"}
        </h2>
        <ol className="flex flex-col gap-3">
          <Step
            index={1}
            status={scenarioStep}
            title="سناریو"
            value={game?.scenario ? game.scenario.name : "یک سناریو انتخاب کنید"}
            onClick={() => setPanel("scenario")}
          >
            {game?.scenario ? (
              <span className="mt-3 flex items-center gap-3">
                <FactionBar counts={activeScenarioCounts} className="flex-1" />
                <span className="shrink-0 text-xs font-bold text-muted">{`${toFa(activeScenarioCounts.total)} نقش`}</span>
              </span>
            ) : players.length && recommendedScenarios.length ? (
              <span className="mt-1 block text-sm font-medium text-accent">{`${toFa(recommendedScenarios.length)} سناریو برای ${toFa(players.length)} نفر آماده است`}</span>
            ) : null}
          </Step>

          <Step
            index={2}
            status={playersStep}
            title="بازیکنان"
            value={
              requiredPlayers
                ? seatsLeft > 0
                  ? `${toFa(players.length)} از ${toFa(requiredPlayers)} · ${toFa(seatsLeft)} صندلی خالی`
                  : seatsLeft < 0
                    ? `${toFa(players.length)} نفر · ${toFa(-seatsLeft)} نفر بیشتر از ظرفیت`
                    : `${toFa(players.length)} نفر · میز کامل است`
                : players.length
                  ? `${toFa(players.length)} نفر نشسته‌اند`
                  : "هنوز کسی ننشسته"
            }
            onClick={() => setPanel("players")}
          >
            {players.length ? (
              <MaskStack
                seeds={players.map((player) => player.userId || player.id)}
                images={players.map((player) => player.image)}
                hues={hues}
                max={7}
                size="sm"
                ringClassName="ring-surface"
                className="mt-3"
              />
            ) : null}
          </Step>

          {configurableRoles.length ? (
            <Step
              index={3}
              status={abilitiesStep}
              title="توانایی‌های شب"
              value={
                missingAbilityRoleNames.length
                  ? `برای ${missingAbilityRoleNames.join("، ")} انتخاب کنید`
                  : `${toFa(configurableRoles.length)} نقش تنظیم شد`
              }
              onClick={() => setPanel("abilities")}
            />
          ) : null}
        </ol>
      </section>

      {/* Start: pinned to the bottom on phones, inline on desktop */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 border-t border-line bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur-xl md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {startDisabledReason ? (
            <p className="text-center text-sm font-bold text-warning" role="status">
              {startDisabledReason}
            </p>
          ) : null}
          <button type="button" onClick={handleStartGame} disabled={Boolean(startDisabledReason) || loading} className="nq-btn nq-btn-primary nq-btn-lg w-full">
            <Play size={20} weight="fill" aria-hidden />
            پخش نقش‌ها و شروع
          </button>
        </div>
      </div>

      {/* 1 · Scenario */}
      <Sheet
        open={panel === "scenario"}
        onClose={() => setPanel(null)}
        size="lg"
        title={game?.scenario ? "سناریو" : "سناریو را انتخاب کنید"}
        eyebrow={players.length ? `${toFa(players.length)} نفر سر میز` : undefined}
        footer={
          <button
            type="button"
            onClick={() => {
              setPanel(null);
              setCustomRoleSearch("");
              setSaveCustomScenario(false);
              setCustomScenarioName("");
              setShowCustomModal(true);
            }}
            className="nq-btn nq-btn-secondary w-full"
          >
            <Plus size={18} weight="bold" aria-hidden />
            چیدن نقش‌ها برای همین میز
          </button>
        }
      >
        <div className="flex flex-col gap-5">
          {game?.scenario ? (
            <div className="rounded-[var(--radius-lg)] bg-raised p-4">
              <p className="text-xs font-bold text-muted">سناریوی این بازی</p>
              <p className="mt-0.5 text-lg font-extrabold">{game.scenario.name}</p>
              <FactionBar counts={activeScenarioCounts} className="mt-3" />
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {scenarioRoles.map((role: any) => (
                  <li key={role.roleId} className="flex items-center gap-1.5 rounded-full bg-surface py-1 pe-1 ps-3 text-sm font-bold">
                    {role.name}
                    {role.count > 1 ? <span className="text-muted">{`× ${toFa(role.count)}`}</span> : null}
                    <FactionTag alignment={role.alignment} compact />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {scenarios.length > 6 ? (
            <label className="flex items-center gap-2">
              <MagnifyingGlass size={20} weight="bold" className="shrink-0 text-muted" aria-hidden />
              <input value={scenarioSearch} onChange={(event) => setScenarioSearch(event.target.value)} placeholder="جستجوی سناریو" aria-label="جستجوی سناریو" />
            </label>
          ) : null}

          {!query && recommendedScenarios.length ? (
            <section>
              <h3 className="mb-1 text-sm font-bold text-accent">{`مناسب ${toFa(players.length)} نفر سر میز`}</h3>
              <ul className="flex flex-col">{recommendedScenarios.map(scenarioRow)}</ul>
            </section>
          ) : null}

          <section>
            {!query && recommendedScenarios.length ? <h3 className="mb-1 text-sm font-bold text-muted">همه سناریوها</h3> : null}
            {otherScenarios.length ? (
              <ul className="flex flex-col">{otherScenarios.map(scenarioRow)}</ul>
            ) : (
              <p className="py-6 text-center text-sm font-medium text-muted">سناریویی با این نام پیدا نشد.</p>
            )}
          </section>
        </div>
      </Sheet>

      {/* 2 · Players */}
      <Sheet
        open={panel === "players"}
        onClose={() => setPanel(null)}
        title="بازیکنان"
        eyebrow={requiredPlayers ? `${toFa(players.length)} از ${toFa(requiredPlayers)} نفر` : `${toFa(players.length)} نفر`}
      >
        <div className="flex flex-col gap-4">
          {!requiredPlayers || seatsLeft > 0 ? (
            <form onSubmit={handleAddGuest} className="flex gap-2">
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                maxLength={40}
                aria-label="نام مهمان"
                placeholder="مهمان بدون گوشی؟ نامش را بنویسید"
                className="min-h-12 min-w-0 flex-1"
              />
              <button type="submit" disabled={addingGuest || !guestName.trim()} className="nq-btn nq-btn-secondary shrink-0">
                <UserPlus size={18} weight="bold" aria-hidden />
                {addingGuest ? "…" : "بنشان"}
              </button>
            </form>
          ) : null}
          {players.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-line-strong p-6 text-center text-sm font-medium leading-7 text-muted">
              هنوز کسی ننشسته. کد را اعلام کنید تا بازیکنان با گوشی خودشان وارد شوند.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {players.map((player) => {
                const seed = player.userId || player.id;
                const busy = busyPlayerId === player.id;
                return (
                  <li key={player.id} className="flex items-center gap-3 py-2.5">
                    <MaskAvatar seed={seed} image={player.image} hue={hues.get(seed)} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{player.name}</span>
                      {!player.userId ? (
                        <span className="text-xs font-bold text-muted">مهمان · بدون گوشی</span>
                      ) : player.joinSource === "TELEGRAM" ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-[#29a9eb]">
                          <TelegramLogo size={12} weight="fill" aria-hidden />
                          از تلگرام
                        </span>
                      ) : null}
                    </span>
                    <button type="button" onClick={() => handleRemovePlayer(player, false)} disabled={busy} className="nq-icon-btn size-10" aria-label={`بیرون کردن ${player.name}`} title="بیرون کردن">
                      <UserMinus size={18} weight="bold" aria-hidden />
                    </button>
                    {player.userId ? (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player, true)}
                        disabled={busy || player.userId === session?.user?.id}
                        className="nq-icon-btn size-10 hover:!text-danger"
                        aria-label={`بیرون کردن و بستن ورود ${player.name}`}
                        title="بیرون کردن و بستن ورود"
                      >
                        <Prohibit size={18} weight="bold" aria-hidden />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Sheet>

      {/* 3 · Night abilities (saved on every tap) */}
      <Sheet
        open={panel === "abilities"}
        onClose={() => setPanel(null)}
        title="توانایی‌های شب"
        eyebrow={savingAbilities ? "در حال ذخیره…" : "هر انتخاب خودکار ذخیره می‌شود"}
        footer={
          <button type="button" onClick={() => setPanel(null)} className="nq-btn nq-btn-primary nq-btn-lg w-full">
            تمام
          </button>
        }
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium leading-6 text-muted">این نقش‌ها چند توانایی دارند. فقط توانایی‌های روشن در دفترچه شب ظاهر می‌شوند.</p>
          {configurableRoles.map((role) => {
            const selectedIds = abilityConfig[role.roleId] || [];
            return (
              <section key={role.roleId}>
                <h3 className="mb-2 flex items-center justify-between gap-2 font-extrabold">
                  {role.name}
                  <FactionTag alignment={role.alignment} />
                </h3>
                <ul className="flex flex-col gap-2">
                  {role.abilities.map((ability) => {
                    const active = selectedIds.includes(ability.id);
                    return (
                      <li key={ability.id}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleAbilityForRole(role.roleId, ability.id)}
                          className={`flex w-full items-start gap-3 rounded-[var(--radius-sm)] p-3 text-right transition-colors ${active ? "bg-accent-soft ring-1 ring-accent/45" : "bg-raised"}`}
                        >
                          <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-accent bg-accent text-on-accent" : "border-line-strong"}`} aria-hidden>
                            {active ? <Check size={12} weight="bold" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-bold">{ability.label}</span>
                            <span className="mt-0.5 block text-sm font-medium leading-6 text-muted">{abilityLimitLabel(ability)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </Sheet>

      {/* Table settings */}
      <Sheet open={panel === "settings"} onClose={() => setPanel(null)} title="تنظیمات میز">
        <div className="flex flex-col gap-5">
          <Switch
            checked={Boolean(game?.telegramJoinEnabled)}
            onChange={() => handleToggleTelegramJoin()}
            disabled={savingTelegramJoin}
            label="ورود از تلگرام"
            description="بازیکنانی که تلگرامشان را وصل کرده‌اند با ربات هم می‌توانند بنشینند."
          />
          <button type="button" onClick={handleDeleteLobby} disabled={deletingLobby} className="nq-btn nq-btn-danger w-full">
            <Trash size={18} weight="bold" aria-hidden />
            لغو این لابی
          </button>
        </div>
      </Sheet>

      <Sheet
        open={showCustomModal}
        onClose={closeCustomSheet}
        size="lg"
        title="چیدن نقش‌ها"
        eyebrow={
          <p className={`text-sm font-bold ${selectedCustomCount > 0 && customScenarioDelta === 0 ? "text-success" : "text-warning"}`}>
            {`${toFa(selectedCustomCount)} از ${toFa(players.length)} نقش · ${customScenarioStatus}`}
          </p>
        }
        footer={
          <div className="flex flex-col gap-3">
            <Switch checked={saveCustomScenario} onChange={setSaveCustomScenario} label="ذخیره در کتابخانه سناریوها" />
            {saveCustomScenario ? (
              <input value={customScenarioName} onChange={(event) => setCustomScenarioName(event.target.value)} maxLength={40} aria-label="نام سناریو" placeholder="نام سناریو، مثلاً «۱۰ نفره جمعه»" />
            ) : null}
            <button type="button" onClick={handleCreateCustomScenario} disabled={settingScenario || selectedCustomCount === 0} className="nq-btn nq-btn-primary nq-btn-lg w-full">
              {`اعمال ${toFa(selectedCustomCount)} نقش`}
            </button>
          </div>
        }
      >
        <label className="sticky top-0 z-10 -mx-1 mb-3 flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface px-1 pb-2">
          <MagnifyingGlass size={20} weight="bold" className="shrink-0 text-muted" aria-hidden />
          <input value={customRoleSearch} onChange={(event) => setCustomRoleSearch(event.target.value)} placeholder="جستجوی نقش" aria-label="جستجوی نقش" />
        </label>
        {filteredCustomRoles.length === 0 ? (
          <p className="py-10 text-center text-sm font-medium text-muted">نقشی با این نام پیدا نشد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filteredCustomRoles.map((role) => {
              const count = customRoles.find((item) => item.roleId === role.id)?.count || 0;
              return (
                <li key={role.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-bold ${count ? "text-fg" : "text-muted"}`}>{role.name}</span>
                  </span>
                  <FactionTag alignment={role.alignment} />
                  <span className="flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-raised p-1">
                    <button type="button" onClick={() => handleCustomRoleChange(role.id, -1)} disabled={count === 0} className="grid size-9 place-items-center rounded-[0.6rem] hover:bg-line disabled:opacity-30" aria-label={`یکی کمتر ${role.name}`}>
                      <Minus size={16} weight="bold" aria-hidden />
                    </button>
                    <span className="w-6 text-center font-black tabular-nums">{toFa(count)}</span>
                    <button type="button" onClick={() => handleCustomRoleChange(role.id, 1)} className="grid size-9 place-items-center rounded-[0.6rem] hover:bg-line" aria-label={`یکی بیشتر ${role.name}`}>
                      <Plus size={16} weight="bold" aria-hidden />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

type StepStatus = "done" | "todo" | "neutral";

function Step({ index, status, title, value, onClick, children }: { index: number; status: StepStatus; title: string; value: string; onClick: () => void; children?: React.ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-start gap-4 rounded-[var(--radius-lg)] border bg-surface p-4 text-right transition-colors hover:border-accent/50 ${status === "todo" ? "border-warning/45" : "border-line"}`}
      >
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-black ${
            status === "done" ? "bg-success/16 text-success" : status === "todo" ? "bg-warning/16 text-warning" : "bg-raised text-muted"
          }`}
          aria-hidden
        >
          {status === "done" ? <Check size={18} weight="bold" /> : index.toLocaleString("fa-IR")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-muted">{title}</span>
          <span className="mt-0.5 line-clamp-2 block break-words text-lg font-extrabold leading-7">{value}</span>
          {children}
        </span>
        <CaretLeft size={20} weight="bold" className="mt-2 shrink-0 text-muted transition-transform group-hover:-translate-x-1" aria-hidden />
      </button>
    </li>
  );
}

function FactionBar({ counts, className = "" }: { counts: { CITIZEN: number; MAFIA: number; NEUTRAL: number; total: number }; className?: string }) {
  return (
    <span className={`flex h-2 overflow-hidden rounded-full bg-raised ${className}`} aria-hidden>
      {(["CITIZEN", "MAFIA", "NEUTRAL"] as const).map((alignment) =>
        counts[alignment] ? <span key={alignment} className={BAR[alignment]} style={{ width: `${(counts[alignment] / (counts.total || 1)) * 100}%` }} /> : null,
      )}
    </span>
  );
}
