"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
import { addGuestPlayer, cancelGame, createCustomGameScenario, getGameStatus, removeWaitingLobbyPlayer, setGameRoleAbilities, setGameScenario, setTelegramJoinEnabled, startGame } from "@/actions/game";
import { getScenarios } from "@/actions/admin";
import { getRoles } from "@/actions/role";
import { ArrowRight, Check, Copy, MagnifyingGlass, Minus, Play, Plus, Prohibit, ShareNetwork, TelegramLogo, Trash, UserMinus, UserPlus } from "@phosphor-icons/react";
import { usePopup } from "@/components/PopupProvider";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
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
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
        <div className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-36 md:pb-10">
      <header className="flex items-center justify-between gap-3">
        <Link href="/dashboard/moderator" className="nq-icon-btn" aria-label="بازگشت به لابی‌ها">
          <ArrowRight size={20} weight="bold" aria-hidden />
        </Link>
        <div className="flex gap-2">
          <button type="button" onClick={shareLobby} className="nq-icon-btn" aria-label="دعوت به این لابی">
            <ShareNetwork size={20} weight="bold" aria-hidden />
          </button>
          <button type="button" onClick={handleDeleteLobby} disabled={deletingLobby} className="nq-icon-btn hover:!text-danger" aria-label="حذف لابی">
            <Trash size={20} weight="bold" aria-hidden />
          </button>
        </div>
      </header>

      <section className="nq-khatam -mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-5">
        <p className="text-sm font-bold text-muted">{game?.scenario?.name || "سناریو هنوز انتخاب نشده"}</p>
        <h1 className="nq-display mt-1 text-[2.6rem] leading-[1.15]">{game?.name || "لابی مافیا"}</h1>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-canvas px-4 py-3">
          <span className="text-sm font-bold text-muted">کد ورود را سر میز بخوانید</span>
          <span className="flex items-center gap-1">
            <span className="text-3xl font-black tracking-[0.16em] text-accent tabular-nums" dir="ltr">
              {faDigits(game?.code || "------")}
            </span>
            <button type="button" onClick={copyCode} className="nq-icon-btn size-10 bg-transparent" aria-label="کپی کد ورود">
              {copied ? <Check size={20} weight="bold" className="text-success" aria-hidden /> : <Copy size={20} weight="bold" aria-hidden />}
            </button>
          </span>
        </div>
        <div className="mt-3">
          <Switch
            checked={Boolean(game?.telegramJoinEnabled)}
            onChange={() => handleToggleTelegramJoin()}
            disabled={savingTelegramJoin}
            label="ورود از تلگرام"
            description="بازیکنانی که تلگرامشان را وصل کرده‌اند با ربات هم می‌توانند بنشینند."
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <section aria-labelledby="seats-title">
          <div className="flex items-baseline justify-between">
            <h2 id="seats-title" className="text-lg font-extrabold">
              دور میز
            </h2>
            <span className="text-sm font-bold text-muted">{requiredPlayers ? `${toFa(players.length)} از ${toFa(requiredPlayers)} نفر` : `${toFa(players.length)} نفر`}</span>
          </div>
          {players.length === 0 ? (
            <p className="mt-3 rounded-[var(--radius-lg)] border border-dashed border-line-strong p-6 text-center text-sm font-medium leading-7 text-muted">
              هنوز کسی ننشسته. کد را اعلام کنید تا بازیکنان با گوشی خودشان وارد شوند.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-surface px-4">
              {players.map((player) => {
                const seed = player.userId || player.id;
                const busy = busyPlayerId === player.id;
                return (
                  <li key={player.id} className="motion-reveal flex items-center gap-3 py-2.5">
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
          {requiredPlayers > players.length ? (
            <p className="mt-2 text-sm font-medium text-muted">{`${toFa(requiredPlayers - players.length)} صندلی خالی مانده.`}</p>
          ) : null}
          {!requiredPlayers || requiredPlayers > players.length ? (
            <form onSubmit={handleAddGuest} className="mt-4 flex gap-2">
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
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="scenario-title">
            <div className="flex items-baseline justify-between">
              <h2 id="scenario-title" className="text-lg font-extrabold">
                سناریو
              </h2>
              {game?.scenario ? (
                <button type="button" onClick={() => handleSelectScenario("")} disabled={settingScenario} className="text-sm font-bold text-accent hover:underline">
                  عوض کردن
                </button>
              ) : null}
            </div>

            {game?.scenario ? (
              <div className="mt-3 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
                <p className="text-xl font-extrabold">{game.scenario.name}</p>
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full" aria-hidden>
                  {(["CITIZEN", "MAFIA", "NEUTRAL"] as const).map((alignment) =>
                    activeScenarioCounts[alignment] ? <span key={alignment} className={BAR[alignment]} style={{ width: `${(activeScenarioCounts[alignment] / (activeScenarioCounts.total || 1)) * 100}%` }} /> : null,
                  )}
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {scenarioRoles.map((role: any) => (
                    <li key={role.roleId} className="flex items-center gap-2 rounded-full border border-line py-1 pe-1 ps-3.5 text-sm font-bold">
                      {role.name}
                      {role.count > 1 ? <span className="text-muted">{`× ${toFa(role.count)}`}</span> : null}
                      <FactionTag alignment={role.alignment} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {players.length > 0 && recommendedScenarios.length > 0 ? (
                  <div>
                    <p className="text-sm font-bold text-muted">{`مناسب ${toFa(players.length)} نفر سر میز:`}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recommendedScenarios.slice(0, 4).map((scenario) => (
                        <button key={scenario.id} type="button" onClick={() => handleSelectScenario(scenario.id)} disabled={settingScenario} className="nq-btn nq-btn-secondary nq-btn-sm">
                          {scenario.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold">از کتابخانه</span>
                  <select onChange={(event) => handleSelectScenario(event.target.value)} value="" disabled={settingScenario}>
                    <option value="">یک سناریو انتخاب کنید</option>
                    {scenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {`${scenario.name} (${toFa(scenario.roles.reduce((sum: number, item: any) => sum + item.count, 0))} نفره)`}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomRoleSearch("");
                    setSaveCustomScenario(false);
                    setCustomScenarioName("");
                    setShowCustomModal(true);
                  }}
                  disabled={settingScenario}
                  className="nq-btn nq-btn-secondary"
                >
                  <Plus size={18} weight="bold" aria-hidden />
                  چیدن نقش‌ها برای همین میز
                </button>
              </div>
            )}
          </section>

          {scenarioAbilityRoles.length > 0 ? (
            <section aria-labelledby="abilities-title">
              <div className="flex items-baseline justify-between">
                <h2 id="abilities-title" className="text-lg font-extrabold">
                  توانایی‌های شب
                </h2>
                <button type="button" onClick={handleSaveAbilityConfig} disabled={savingAbilities || settingScenario} className="nq-btn nq-btn-secondary nq-btn-sm">
                  {savingAbilities ? "در حال ذخیره…" : "ذخیره"}
                </button>
              </div>
              <p className="mt-1 text-sm font-medium leading-6 text-muted">نقش‌هایی که چند توانایی دارند، فقط با توانایی‌های روشن در دفترچه شب ظاهر می‌شوند.</p>
              <div className="mt-3 flex flex-col gap-3">
                {scenarioAbilityRoles.map((role) => {
                  const selectedIds = abilityConfig[role.roleId] || [];
                  return (
                    <div key={role.roleId} className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                      <p className="flex items-center justify-between gap-2 font-extrabold">
                        {role.name}
                        <FactionTag alignment={role.alignment} />
                      </p>
                      <ul className="mt-3 flex flex-col gap-2">
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
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Start: pinned to the bottom on phones, inline on desktop */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 border-t border-line bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur-xl md:static md:mt-2 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className={`text-sm font-bold ${startDisabledReason ? "text-warning" : "text-success"}`} role="status">
            {startDisabledReason || "همه چیز آماده است. نقش‌ها مخفیانه روی گوشی هر نفر می‌رود."}
          </p>
          <button type="button" onClick={handleStartGame} disabled={Boolean(startDisabledReason) || loading} className="nq-btn nq-btn-primary nq-btn-lg md:min-w-56">
            <Play size={20} weight="fill" aria-hidden />
            پخش نقش‌ها و شروع
          </button>
        </div>
      </div>

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
