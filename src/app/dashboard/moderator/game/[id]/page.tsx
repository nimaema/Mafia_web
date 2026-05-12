"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  deleteNightEvent,
  endGame,
  getGameStatus,
  publishNightRecords,
  recordDayElimination,
  recordNightEvent,
  setPlayerAliveStatus,
  updateDayEventRecord,
  updateNightEventRecord,
} from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { MobilePwaFeatureLock } from "@/components/MobilePwaFeatureLock";
import { GameReportTimeline, type GameReportEvent } from "@/components/game/GameReportTimeline";

type Alignment = "CITIZEN" | "MAFIA" | "NEUTRAL";
type AbilityEffectType = "NONE" | "CONVERT_TO_MAFIA" | "YAKUZA" | "TWO_NAME_INQUIRY";

type RoleNightAbility = {
  id: string;
  label: string;
  usesPerGame: number | null;
  usesPerNight: number | null;
  targetsPerUse: number;
  selfTargetLimit: number | null;
  choices: {
    id: string;
    label: string;
    usesPerGame: number | null;
    effectType?: AbilityEffectType;
  }[];
  effectType?: AbilityEffectType;
};

type PlayerRecord = {
  id: string;
  name: string;
  user?: { image?: string | null } | null;
  image?: string | null;
  joinSource?: "WEB" | "TELEGRAM";
  isAlive?: boolean;
  eliminatedAt?: Date | string | null;
  role?: {
    id: string;
    name: string;
    description?: string | null;
    alignment?: Alignment;
    nightAbilities?: RoleNightAbility[] | null;
  } | null;
};

type NightEventRecord = {
  id: string;
  nightNumber: number;
  abilityKey: string;
  abilityLabel: string;
  abilityChoiceKey?: string | null;
  abilityChoiceLabel?: string | null;
  abilitySource?: string | null;
  actorPlayer?: PlayerRecord | null;
  targetPlayer?: PlayerRecord | null;
  actorAlignment?: Alignment | null;
  wasUsed?: boolean;
  details?: {
    phase?: "NIGHT" | "DAY";
    methodKey?: string | null;
    methodLabel?: string | null;
    effectType?: AbilityEffectType;
    secondaryTargetPlayerId?: string | null;
    secondaryTargetName?: string | null;
    extraTargets?: { id: string; name: string }[];
    targetLabels?: { label: string; playerId?: string | null; playerName?: string | null }[];
    convertedRoleId?: string | null;
    convertedRoleName?: string | null;
    previousRoleName?: string | null;
    sacrificePlayerId?: string | null;
    sacrificePlayerName?: string | null;
    defensePlayers?: { id: string; name: string; roleName?: string | null }[];
  } | null;
  note?: string | null;
  isPublic?: boolean;
};

type NightActionOption = {
  key: string;
  label: string;
  source: "side" | "role";
  sourceLabel: string;
  actorAlignment?: Alignment;
  candidates: PlayerRecord[];
  usesPerGame: number | null;
  usesPerNight: number | null;
  targetsPerUse: number;
  selfTargetLimit: number | null;
  effectType: AbilityEffectType;
  choices: RoleNightAbility["choices"];
  className: string;
};

type PlayerPickerRequest = {
  slot: "target" | "secondary" | "extra" | "day" | "defense";
  title: string;
  options: PlayerRecord[];
  index?: number;
  multi?: boolean;
};

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

function alignmentLabel(alignment?: Alignment | null) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  if (alignment === "NEUTRAL") return "مستقل";
  return "نامشخص";
}

function alignmentClass(alignment?: Alignment | null) {
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  if (alignment === "NEUTRAL") return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  return "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]";
}

function alignmentIcon(alignment?: Alignment | null) {
  if (alignment === "CITIZEN") return "verified_user";
  if (alignment === "MAFIA") return "local_police";
  if (alignment === "NEUTRAL") return "casino";
  return "help";
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
        choices: Array.isArray(ability.choices)
          ? ability.choices
              .map((choice, choiceIndex) => {
                const choiceLabel = String(choice.label || "").trim();
                if (!choiceLabel) return null;
                return {
                  id: String(choice.id || `choice-${choiceIndex + 1}`),
                  label: choiceLabel,
                  usesPerGame: typeof choice.usesPerGame === "number" ? choice.usesPerGame : null,
                  effectType: normalizeEffectType(choice.effectType),
                };
              })
              .filter(Boolean) as RoleNightAbility["choices"]
          : [],
      };
    })
    .filter(Boolean) as RoleNightAbility[];
}

function normalizeActiveRoleAbilityConfig(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string[]>>((config, [roleId, abilityIds]) => {
    if (!Array.isArray(abilityIds)) return config;
    config[roleId] = abilityIds.map((item) => String(item || "").trim()).filter(Boolean);
    return config;
  }, {});
}

function usageLabel(usesPerGame: number | null) {
  return usesPerGame ? `${usesPerGame} بار در کل بازی` : "بدون سقف کلی";
}

function abilityLimitLabel(option: NightActionOption) {
  const targetCount = option.targetsPerUse || 1;
  const selfLimit = option.selfTargetLimit ?? 0;
  const parts = [
    option.usesPerGame ? `سقف هر انجام‌دهنده: ${option.usesPerGame} بار در کل بازی` : "قابل ثبت بدون سقف کلی",
    option.usesPerNight ? `در هر شب تا ${option.usesPerNight} بار` : "قابل ثبت در هر شب",
    targetCount > 1 ? `هر ثبت شامل ${targetCount} هدف/گزینه` : "هر ثبت روی ۱ هدف",
  ];
  parts.push(selfLimit > 0 ? `روی خودش تا ${selfLimit} بار` : "روی خودش مجاز نیست");
  if (option.effectType !== "NONE") parts.push(effectLabel(option.effectType));
  if (option.choices.length) parts.push(`${option.choices.length} نام برای هدف‌ها`);
  return parts.join("، ");
}

function abilityCompactLabel(option: NightActionOption) {
  const parts = [
    option.usesPerNight ? `هر شب ${option.usesPerNight}` : "هر شب آزاد",
    option.targetsPerUse > 1 ? `${option.targetsPerUse} هدف ممکن` : "۱ هدف",
  ];
  if (option.usesPerGame) parts.push(`کل ${option.usesPerGame}`);
  if (option.effectType !== "NONE") parts.push(effectLabel(option.effectType));
  return parts.join(" | ");
}

const DAY_ELIMINATION_METHODS = [
  { key: "vote", label: "رای‌گیری", icon: "how_to_vote" },
  { key: "gun", label: "شلیک روز", icon: "target" },
  { key: "bazporsi", label: "بازپرسی", icon: "find_in_page" },
  { key: "custom", label: "روش سناریو", icon: "edit_note" },
];

function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function createTimerAudioContext() {
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : null;
}

function playTimerAlarm(existingContext?: AudioContext | null) {
  const contextFromCaller = Boolean(existingContext);
  const audioContext = existingContext || createTimerAudioContext();
  if (!audioContext) return;
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => null);
  }

  const pattern = [
    { offset: 0, frequency: 880 },
    { offset: 0.28, frequency: 1180 },
    { offset: 0.56, frequency: 880 },
    { offset: 1.02, frequency: 1180 },
    { offset: 1.3, frequency: 880 },
    { offset: 1.58, frequency: 1180 },
  ];

  pattern.forEach(({ offset, frequency }) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.42, audioContext.currentTime + offset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + offset + 0.24);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime + offset);
    oscillator.stop(audioContext.currentTime + offset + 0.26);
  });

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([260, 110, 260, 110, 420]);
  }

  if (!contextFromCaller) {
    window.setTimeout(() => audioContext.close().catch(() => null), 2400);
  }
}

function SpeechTimer({
  title,
  subtitle,
  icon,
  defaultSeconds,
  tone,
}: {
  title: string;
  subtitle: string;
  icon: string;
  defaultSeconds: number;
  tone: "primary" | "amber";
}) {
  const [duration, setDuration] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const alarmedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const progress = duration > 0 ? Math.max(0, Math.min(100, (remaining / duration) * 100)) : 0;
  const toneClass = tone === "primary"
    ? "border-[var(--pm-primary)]/25 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]"
    : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          if (!alarmedRef.current) {
            alarmedRef.current = true;
            playTimerAlarm(audioContextRef.current);
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => null);
    };
  }, []);

  const primeAlarm = () => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = createTimerAudioContext();
    }
    audioContextRef.current?.resume().catch(() => null);
  };

  const toggleRunning = () => {
    primeAlarm();
    if (running) {
      setRunning(false);
      return;
    }
    alarmedRef.current = false;
    setRemaining((value) => (value > 0 ? value : duration));
    setRunning(true);
  };

  const reset = () => {
    alarmedRef.current = false;
    setRunning(false);
    setRemaining(duration);
  };

  const updateDuration = (nextSeconds: number) => {
    const normalized = Math.max(5, Math.min(900, Math.round(nextSeconds)));
    setDuration(normalized);
    setRemaining(normalized);
    setRunning(false);
    alarmedRef.current = false;
  };

  return (
    <article className={`overflow-hidden rounded-lg border ${toneClass}`}>
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/70 text-xl dark:bg-zinc-950/40">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--pm-text)]">{title}</p>
            <p className="mt-1 text-[10px] font-bold leading-5 opacity-80">{subtitle}</p>
          </div>
        </div>
        <p className="font-mono text-2xl font-black tabular-nums text-[var(--pm-text)]">{formatTimer(remaining)}</p>
      </div>

      <div className="px-3 pb-3">
        <div className="h-2 overflow-hidden rounded-full bg-white/70 dark:bg-zinc-950/50">
          <div className={tone === "primary" ? "h-full rounded-full bg-[var(--pm-primary)] transition-[width]" : "h-full rounded-full bg-amber-500 transition-[width]"} style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-[1fr_44px_96px] gap-2">
          <button type="button" onClick={toggleRunning} className="pm-button-primary min-h-10 px-3 text-xs">
            <span className="material-symbols-outlined text-base">{running ? "pause" : "play_arrow"}</span>
            {running ? "مکث" : remaining > 0 && remaining < duration ? "ادامه" : "شروع"}
          </button>
          <button type="button" onClick={reset} className="pm-button-secondary min-h-10 px-0" aria-label="بازنشانی">
            <span className="material-symbols-outlined text-base">replay</span>
          </button>
          <label className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--pm-muted)]">ثانیه</span>
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={900}
              step={5}
              value={duration}
              onChange={(event) => updateDuration(Number(event.target.value) || defaultSeconds)}
              className="min-h-10 w-full rounded-lg pl-10 pr-2 text-center text-xs font-black tabular-nums"
              aria-label="مدت تایمر به ثانیه"
            />
          </label>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {[-15, 15, 30, 60].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => updateDuration(duration + delta)}
              className="rounded-lg border border-[var(--pm-line)] bg-white/60 py-1.5 text-[10px] font-black text-[var(--pm-muted)] transition-all hover:bg-white dark:border-[var(--pm-line)] dark:bg-zinc-950/30 dark:text-zinc-300"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function ModeratorTimerBoard() {
  return (
    <section className="pm-card overflow-hidden">
      <div className="border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">تایمر صحبت</p>
        <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">نوبت و چالش</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--pm-muted)]">
          هنگام شروع صحبت بازیکن یا چالش، تایمر مناسب را بزنید؛ پایان زمان با صدا اعلام می‌شود.
        </p>
      </div>
      <div className="grid gap-3 p-4">
        <SpeechTimer title="نوبت اصلی" subtitle="برای صحبت معمول بازیکن" icon="record_voice_over" defaultSeconds={60} tone="primary" />
        <SpeechTimer title="چالش" subtitle="زمان کوتاه برای پاسخ یا دفاع" icon="forum" defaultSeconds={30} tone="amber" />
      </div>
    </section>
  );
}

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

function playerImage(player: PlayerRecord) {
  return player.image || player.user?.image || null;
}

function isDayEvent(event: NightEventRecord) {
  return event.details?.phase === "DAY" || event.abilityKey.startsWith("day:");
}

function reportEventTitle(event: NightEventRecord) {
  if (isDayEvent(event)) return event.details?.methodLabel || event.abilityLabel.replace(/^حذف روز:\s*/, "") || "حذف روز";
  return `${event.abilityLabel}${event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}`;
}

export default function ModeratorGamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { showAlert, showConfirm, showToast } = usePopup();
  const gameId = params.id as string;
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nightNumber, setNightNumber] = useState(1);
  const [selectedActionKey, setSelectedActionKey] = useState("");
  const [selectedChoiceKey, setSelectedChoiceKey] = useState("");
  const [eventWasUsed, setEventWasUsed] = useState(true);
  const [actorPlayerId, setActorPlayerId] = useState("");
  const [targetPlayerId, setTargetPlayerId] = useState("");
  const [secondaryTargetPlayerId, setSecondaryTargetPlayerId] = useState("");
  const [extraTargetPlayerIds, setExtraTargetPlayerIds] = useState<string[]>([]);
  const [convertedRoleId, setConvertedRoleId] = useState("");
  const [reportEffectType, setReportEffectType] = useState<AbilityEffectType>("NONE");
  const [nightNote, setNightNote] = useState("");
  const [dayNumber, setDayNumber] = useState(1);
  const [dayTargetPlayerId, setDayTargetPlayerId] = useState("");
  const [dayDefensePlayerIds, setDayDefensePlayerIds] = useState<string[]>([]);
  const [dayMethodKey, setDayMethodKey] = useState("vote");
  const [customDayMethod, setCustomDayMethod] = useState("");
  const [dayNote, setDayNote] = useState("");
  const [reportMode, setReportMode] = useState<"NIGHT" | "DAY">("DAY");
  const [reportChooserOpen, setReportChooserOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [playerPicker, setPlayerPicker] = useState<PlayerPickerRequest | null>(null);
  const [shotResolution, setShotResolution] = useState<{ player: PlayerRecord; nextRound: number } | null>(null);

  const refreshGame = async (showLoader = false) => {
    if (sessionStatus === "loading") return;
    if (showLoader) setLoading(true);
    const result = await getGameStatus(gameId);
    if (!result) {
      router.replace("/dashboard/moderator");
      return;
    }
    if (result.moderatorId !== session?.user?.id) {
      router.replace(result.status === "WAITING" ? `/lobby/${gameId}` : result.status === "IN_PROGRESS" ? `/game/${gameId}` : "/dashboard/user");
      return;
    }
    setGame(result);
    const events = (result.nightEvents || []) as NightEventRecord[];
    const latestNight = Math.max(1, ...events.filter((event) => !isDayEvent(event)).map((event) => event.nightNumber));
    const latestDay = Math.max(1, ...events.filter((event) => isDayEvent(event)).map((event) => event.nightNumber));
    setNightNumber((current) => Math.max(current, latestNight));
    setDayNumber((current) => Math.max(current, latestDay));
    setLoading(false);
  };

  useEffect(() => {
    if (sessionStatus === "loading") return;
    refreshGame(true);
  }, [gameId, session?.user?.id, sessionStatus]);

  const players: PlayerRecord[] = game?.players || [];
  const mafiaConversionRoles: { id: string; name: string }[] = game?.mafiaConversionRoles || [];
  const alivePlayers = players.filter((player) => player.isAlive !== false);
  const eliminatedPlayers = players.filter((player) => player.isAlive === false);
  const displayPlayers = useMemo(
    () =>
      [...players].sort((left, right) => {
        const leftAlive = left.isAlive !== false ? 0 : 1;
        const rightAlive = right.isAlive !== false ? 0 : 1;
        if (leftAlive !== rightAlive) return leftAlive - rightAlive;
        return left.name.localeCompare(right.name, "fa");
      }),
    [players]
  );
  const selectedDefensePlayers = useMemo(
    () => dayDefensePlayerIds.map((playerId) => players.find((player) => player.id === playerId)).filter(Boolean) as PlayerRecord[],
    [dayDefensePlayerIds, players]
  );
  const nightEvents: NightEventRecord[] = game?.nightEvents || [];
  const activeRoleAbilities = useMemo(() => normalizeActiveRoleAbilityConfig(game?.activeRoleAbilities), [game?.activeRoleAbilities]);

  const actionOptions = useMemo<NightActionOption[]>(() => {
    const mafiaPlayers = players.filter((player) => player.role?.alignment === "MAFIA");
    const options: NightActionOption[] = [
      {
        key: "side:mafia-shot",
        label: "شلیک مافیا",
        source: "side",
        sourceLabel: "جبهه مافیا",
        actorAlignment: "MAFIA",
        candidates: mafiaPlayers,
        usesPerGame: null,
        usesPerNight: 1,
        targetsPerUse: 1,
        selfTargetLimit: 0,
        effectType: "NONE",
        choices: [],
        className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",
      },
    ];

    const roleAbilityMap = new Map<string, NightActionOption>();
    players.forEach((player) => {
      const role = player.role;
      if (!role?.id) return;
      const abilities = normalizeRoleAbilities(role.nightAbilities);
      const configuredAbilityIds = activeRoleAbilities[role.id];
      const visibleAbilities = Array.isArray(configuredAbilityIds)
        ? abilities.filter((ability) => configuredAbilityIds.includes(ability.id))
        : abilities;
      visibleAbilities.forEach((ability) => {
        const key = `role:${role.id}:${ability.id}`;
        const storedEffectType = normalizeEffectType(ability.effectType);
        const effectType = storedEffectType !== "NONE" ? storedEffectType : inferEffectTypeFromLabel(ability.label);
        const existing = roleAbilityMap.get(key);
        if (existing) {
          existing.candidates.push(player);
          return;
        }
        roleAbilityMap.set(key, {
          key,
          label: ability.label,
          source: "role",
          sourceLabel: role.name,
          candidates: [player],
          usesPerGame: ability.usesPerGame,
          usesPerNight: ability.usesPerNight,
          targetsPerUse: ability.targetsPerUse,
          selfTargetLimit: ability.selfTargetLimit,
          effectType,
          choices: ability.choices,
          className: alignmentClass(role.alignment),
        });
      });
    });

    return [...options, ...roleAbilityMap.values()];
  }, [activeRoleAbilities, players]);

  useEffect(() => {
    if (actionOptions.length === 0) return;
    if (!actionOptions.some((option) => option.key === selectedActionKey)) {
      setSelectedActionKey(actionOptions[0].key);
      setActorPlayerId("");
    }
  }, [actionOptions, selectedActionKey]);

  const selectedAction = actionOptions.find((option) => option.key === selectedActionKey) || actionOptions[0];
  const usesTargetSlotChoices = Boolean(selectedAction && selectedAction.targetsPerUse > 1 && selectedAction.choices.length >= selectedAction.targetsPerUse);
  const selectedChoice = usesTargetSlotChoices
    ? null
    : selectedAction?.choices.find((choice) => choice.id === selectedChoiceKey) || selectedAction?.choices[0] || null;
  const fixedEffectType = normalizeEffectType(selectedChoice?.effectType !== "NONE" ? selectedChoice?.effectType : selectedAction?.effectType);
  const canChooseReportEffect = false;
  const selectedEffectType = fixedEffectType !== "NONE" ? fixedEffectType : canChooseReportEffect ? reportEffectType : "NONE";
  const selectedTargetCount = Math.max(
    selectedEffectType === "TWO_NAME_INQUIRY" ? 2 : 1,
    selectedAction?.targetsPerUse || 1
  );
  const needsConversionRole = selectedEffectType === "CONVERT_TO_MAFIA" || selectedEffectType === "YAKUZA";
  const needsSecondaryTarget = selectedEffectType === "YAKUZA" || selectedEffectType === "TWO_NAME_INQUIRY";
  const showsSecondaryTarget = needsSecondaryTarget || selectedTargetCount > 1;
  const targetPlayerOptions = needsConversionRole
    ? players.filter((player) => player.role?.alignment !== "MAFIA")
    : players;
  const secondaryTargetOptions = selectedEffectType === "YAKUZA"
    ? players.filter((player) => player.role?.alignment === "MAFIA")
    : players;
  const extraTargetSlots = Math.max(0, selectedTargetCount - 2);

  useEffect(() => {
    if (!selectedAction) return;
    if (selectedAction.choices.length > 0 && !selectedAction.choices.some((choice) => choice.id === selectedChoiceKey)) {
      setSelectedChoiceKey(selectedAction.choices[0].id);
    }
    if (selectedAction.choices.length === 0 && selectedChoiceKey) {
      setSelectedChoiceKey("");
    }
  }, [selectedAction, selectedChoiceKey]);

  useEffect(() => {
    setReportEffectType("NONE");
  }, [selectedActionKey, selectedChoiceKey]);

  useEffect(() => {
    if (!convertedRoleId && mafiaConversionRoles.length > 0) {
      const simpleMafia =
        mafiaConversionRoles.find((role) => role.name.includes("ساده") || role.name.toLowerCase().includes("simple")) ||
        mafiaConversionRoles[0];
      setConvertedRoleId(simpleMafia.id);
    }
  }, [convertedRoleId, mafiaConversionRoles]);

  useEffect(() => {
    setExtraTargetPlayerIds((current) => current.slice(0, extraTargetSlots));
  }, [extraTargetSlots, selectedActionKey]);

  const reportRounds = useMemo(() => {
    const groups = new Map<number, { night: NightEventRecord[]; day: NightEventRecord[] }>();
    nightEvents.forEach((event) => {
      const existing = groups.get(event.nightNumber) || { night: [], day: [] };
      if (isDayEvent(event)) existing.day.push(event);
      else existing.night.push(event);
      groups.set(event.nightNumber, existing);
    });
    return [...groups.entries()]
      .sort(([left], [right]) => left - right)
      .map(([round, events]) => ({ round, ...events }));
  }, [nightEvents]);

  const mafiaShotAction = actionOptions.find((option) => option.key === "side:mafia-shot");
  const roleActionOptions = actionOptions.filter((option) => option.source === "role");
  const latestReportRound = Math.max(
    dayNumber,
    nightNumber,
    reportRounds.reduce((latest, round) => Math.max(latest, round.round), 1)
  );
  const chronologicalPhases = useMemo(() => {
    const roundMap = new Map(reportRounds.map((round) => [round.round, round]));
    return Array.from({ length: latestReportRound }, (_, index) => {
      const round = index + 1;
      const reportRound = roundMap.get(round);
      return [
        {
          key: `day-${round}`,
          type: "DAY" as const,
          round,
          label: `روز ${round}`,
          nextLabel: `بعد از پایان، شب ${round} فعال می‌شود`,
          icon: "wb_sunny",
          events: reportRound?.day || [],
          active: reportMode === "DAY" && dayNumber === round,
        },
        {
          key: `night-${round}`,
          type: "NIGHT" as const,
          round,
          label: `شب ${round}`,
          nextLabel: `بعد از پایان، روز ${round + 1} فعال می‌شود`,
          icon: "dark_mode",
          events: reportRound?.night || [],
          active: reportMode === "NIGHT" && nightNumber === round,
        },
      ];
    }).flat();
  }, [dayNumber, latestReportRound, nightNumber, reportMode, reportRounds]);
  const recordedReportPhases = chronologicalPhases.filter((phase) => phase.events.length > 0);
  const activePhaseLabel = reportMode === "DAY" ? `روز ${dayNumber}` : `شب ${nightNumber}`;
  const nextPhaseLabel = reportMode === "DAY" ? `شب ${dayNumber}` : `روز ${nightNumber + 1}`;
  const chooserPhaseLabel = reportMode === "DAY" ? `روز ${dayNumber}` : `شب ${nightNumber}`;

  const resetNightTargets = () => {
    setTargetPlayerId("");
    setSecondaryTargetPlayerId("");
    setExtraTargetPlayerIds([]);
  };

  const openNightAction = (option: NightActionOption, actor?: PlayerRecord | null, wasUsed = true) => {
    setEditingEventId(null);
    setReportChooserOpen(false);
    setReportMode("NIGHT");
    setSelectedActionKey(option.key);
    setSelectedChoiceKey(option.choices[0]?.id || "");
    setActorPlayerId(actor?.id || "");
    setEventWasUsed(wasUsed);
    resetNightTargets();
    setNightNote("");
    setReportModalOpen(true);
  };

  const openDayRecord = (methodKey = dayMethodKey, targetId = "") => {
    setEditingEventId(null);
    setReportChooserOpen(false);
    setReportMode("DAY");
    setDayMethodKey(methodKey);
    if (methodKey !== "vote") setDayDefensePlayerIds([]);
    setDayTargetPlayerId(targetId);
    setReportModalOpen(true);
  };

  const openReportChooser = (mode: "DAY" | "NIGHT" = reportMode) => {
    setEditingEventId(null);
    setPlayerPicker(null);
    setReportModalOpen(false);
    setReportMode(mode);
    setReportChooserOpen(true);
  };

  const openPlayerPicker = (request: PlayerPickerRequest) => {
    setPlayerPicker(request);
  };

  const pickPlayer = (playerId: string) => {
    if (!playerPicker) return;
    if (playerPicker.slot === "defense") {
      setDayDefensePlayerIds((current) =>
        current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
      );
      return;
    }
    if (playerPicker.slot === "target") setTargetPlayerId(playerId);
    if (playerPicker.slot === "secondary") setSecondaryTargetPlayerId(playerId);
    if (playerPicker.slot === "day") setDayTargetPlayerId(playerId);
    if (playerPicker.slot === "extra" && typeof playerPicker.index === "number") {
      setExtraTargetPlayerIds((current) => {
        const next = [...current];
        next[playerPicker.index as number] = playerId;
        return next;
      });
    }
    setPlayerPicker(null);
  };

  const clearPlayerSlot = (slot: PlayerPickerRequest["slot"], index?: number) => {
    if (slot === "target") setTargetPlayerId("");
    if (slot === "secondary") setSecondaryTargetPlayerId("");
    if (slot === "day") setDayTargetPlayerId("");
    if (slot === "defense") setDayDefensePlayerIds([]);
    if (slot === "extra" && typeof index === "number") {
      setExtraTargetPlayerIds((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
    }
  };

  const playerById = (playerId?: string) => players.find((player) => player.id === playerId);

  const openEditReportEvent = (event: NightEventRecord) => {
    setEditingEventId(event.id);
    setReportChooserOpen(false);
    setPlayerPicker(null);
    setReportModalOpen(true);

    if (isDayEvent(event)) {
      const storedMethodKey = event.details?.methodKey || event.abilityKey.replace(/^day:/, "") || "custom";
      const knownMethod = DAY_ELIMINATION_METHODS.some((method) => method.key === storedMethodKey);
      setReportMode("DAY");
      setDayNumber(event.nightNumber);
      setDayMethodKey(knownMethod ? storedMethodKey : "custom");
      setCustomDayMethod(knownMethod ? "" : event.details?.methodLabel || reportEventTitle(event));
      setDayTargetPlayerId(event.targetPlayer?.id || "");
      setDayDefensePlayerIds(event.details?.defensePlayers?.map((player) => player.id).filter(Boolean) || []);
      setDayNote(event.note || "");
      return;
    }

    const action = actionOptions.find((option) => option.key === event.abilityKey);
    if (!action) {
      showAlert("ویرایش گزارش", "این توانایی در تنظیمات فعلی سناریو پیدا نشد. می‌توانید رکورد را حذف و دوباره ثبت کنید.", "warning");
      setEditingEventId(null);
      setReportModalOpen(false);
      return;
    }

    setReportMode("NIGHT");
    setNightNumber(event.nightNumber);
    setSelectedActionKey(event.abilityKey);
    setSelectedChoiceKey(event.abilityChoiceKey || action.choices[0]?.id || "");
    setActorPlayerId(event.actorPlayer?.id || "");
    setTargetPlayerId(event.targetPlayer?.id || "");
    setSecondaryTargetPlayerId(event.details?.secondaryTargetPlayerId || "");
    setExtraTargetPlayerIds(event.details?.extraTargets?.map((target) => target.id).filter(Boolean) || []);
    setConvertedRoleId(event.details?.convertedRoleId || "");
    setReportEffectType(event.details?.effectType || "NONE");
    setEventWasUsed(event.wasUsed !== false);
    setNightNote(event.note || "");
  };

  const advanceToNextDay = (nextRound: number) => {
    setReportChooserOpen(false);
    setReportMode("DAY");
    setDayNumber((current) => Math.max(current, nextRound));
    setNightNumber(nextRound);
    setReportModalOpen(false);
    setPlayerPicker(null);
    setShotResolution(null);
    showToast(`روز ${nextRound} فعال شد`, "success");
  };

  const finishCurrentPhase = () => {
    setReportChooserOpen(false);
    if (reportMode === "DAY") {
      setReportMode("NIGHT");
      setNightNumber((current) => Math.max(current, dayNumber));
      setReportModalOpen(false);
      setPlayerPicker(null);
      showToast(`شب ${dayNumber} فعال شد`, "success");
      return;
    }
    const nextRound = nightNumber + 1;
    const unresolvedMafiaShot = nightEvents.find(
      (event) =>
        event.nightNumber === nightNumber &&
        event.abilityKey === "side:mafia-shot" &&
        event.wasUsed !== false &&
        event.targetPlayer?.id &&
        event.targetPlayer.isAlive !== false
    );

    if (unresolvedMafiaShot?.targetPlayer) {
      setReportModalOpen(false);
      setPlayerPicker(null);
      setShotResolution({ player: unresolvedMafiaShot.targetPlayer, nextRound });
      return;
    }

    advanceToNextDay(nextRound);
  };

  const resolveMafiaShot = async (isDead: boolean) => {
    if (!shotResolution) return;
    if (!isDead) {
      advanceToNextDay(shotResolution.nextRound);
      showToast(`${shotResolution.player.name} زنده ماند`, "info");
      return;
    }

    setBusy(true);
    const result = await setPlayerAliveStatus(gameId, shotResolution.player.id, false);
    if (result.success) {
      showToast(`${shotResolution.player.name} با شلیک شب حذف شد`, "success");
      await refreshGame();
      advanceToNextDay(shotResolution.nextRound);
    } else {
      showAlert("خطا", result.error || "ثبت حذف شلیک مافیا انجام نشد", "error");
    }
    setBusy(false);
  };

  const renderPlayerButton = ({
    label,
    value,
    slot,
    options,
    index,
    disabled = false,
    required = false,
  }: {
    label: string;
    value?: string;
    slot: PlayerPickerRequest["slot"];
    options: PlayerRecord[];
    index?: number;
    disabled?: boolean;
    required?: boolean;
  }) => {
    const selectedPlayer = playerById(value);
    const image = selectedPlayer ? playerImage(selectedPlayer) : null;
    return (
      <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-2 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-black text-[var(--pm-muted)]">{label}</span>
          {!required && value && (
            <button
              type="button"
              onClick={() => clearPlayerSlot(slot, index)}
              className="text-[10px] font-black text-[var(--pm-muted)] transition-colors hover:text-red-500"
            >
              پاک کردن
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => openPlayerPicker({ slot, title: label, options, index })}
          disabled={disabled}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-[var(--pm-line)] bg-white p-2 text-right transition-all hover:border-[var(--pm-primary)]/40 hover:bg-[var(--pm-primary)]/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--pm-line)] dark:bg-zinc-950/60"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
              {selectedPlayer ? image ? <img src={image} alt="" className="size-full object-cover" /> : getInitial(selectedPlayer.name) : <span className="material-symbols-outlined text-lg">person_search</span>}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-[var(--pm-text)]">
                {selectedPlayer?.name || "انتخاب بازیکن"}
              </span>
              <span className="block truncate text-[10px] font-bold text-[var(--pm-muted)]">
                {selectedPlayer?.role?.name || "پنجره انتخاب باز می‌شود"}
              </span>
            </span>
          </span>
          <span className="material-symbols-outlined text-lg text-[var(--pm-muted)]">open_in_new</span>
        </button>
      </div>
    );
  };

  const handleTogglePlayer = (player: PlayerRecord) => {
    const nextAlive = player.isAlive === false;
    showConfirm(
      nextAlive ? "بازگرداندن بازیکن" : "ثبت حذف بازیکن",
      nextAlive
        ? `${player.name} دوباره به عنوان بازیکن فعال نمایش داده شود؟`
        : `${player.name} به عنوان بازیکن حذف‌شده ثبت شود؟ این وضعیت برای بازیکنان هم نمایش داده می‌شود.`,
      async () => {
        setBusy(true);
        const result = await setPlayerAliveStatus(gameId, player.id, nextAlive);
        if (result.success) {
          showToast(nextAlive ? "بازیکن به بازی برگشت" : "وضعیت حذف بازیکن ثبت شد", "success");
          await refreshGame();
        } else {
          showAlert("خطا", result.error || "تغییر وضعیت بازیکن انجام نشد", "error");
        }
        setBusy(false);
      },
      nextAlive ? "warning" : "error"
    );
  };

  const handleRecordNightEvent = async () => {
    if (!selectedAction) {
      showAlert("اتفاق شب", "نوع اتفاق شب را انتخاب کنید.", "warning");
      return;
    }
    if (selectedAction.source === "role" && !actorPlayerId) {
      showAlert("بازیکن انجام‌دهنده", "برای توانایی نقش، بازیکن انجام‌دهنده را انتخاب کنید.", "warning");
      return;
    }
    if (eventWasUsed && !targetPlayerId) {
      showAlert("بازیکن هدف", "بازیکن هدف یا اثر را انتخاب کنید.", "warning");
      return;
    }
    if (eventWasUsed && needsSecondaryTarget && !secondaryTargetPlayerId) {
      showAlert(
        selectedEffectType === "YAKUZA" ? "بازیکن قربانی" : "هدف دوم",
        selectedEffectType === "YAKUZA" ? "برای یاکوزا، بازیکن مافیایی قربانی را انتخاب کنید." : "برای این توانایی هدف دوم را هم انتخاب کنید.",
        "warning"
      );
      return;
    }
    const selectedTargets = [targetPlayerId, secondaryTargetPlayerId, ...extraTargetPlayerIds.slice(0, extraTargetSlots)].filter(Boolean);
    if (eventWasUsed && new Set(selectedTargets).size !== selectedTargets.length) {
      showAlert("هدف تکراری", "برای یک توانایی، هر هدف باید یک بازیکن متفاوت باشد.", "warning");
      return;
    }
    if (eventWasUsed && needsConversionRole && !convertedRoleId) {
      showAlert("نقش تبدیل", "برای خریداری یا یاکوزا، نقش مافیایی مقصد را انتخاب کنید.", "warning");
      return;
    }
    const comparableNightEvents = editingEventId ? nightEvents.filter((event) => event.id !== editingEventId) : nightEvents;
    if (eventWasUsed && selectedAction.usesPerGame && actorPlayerId) {
      const usedByActor = comparableNightEvents.filter(
        (event) => event.wasUsed !== false && event.abilityKey === selectedAction.key && event.actorPlayer?.id === actorPlayerId
      ).length;
      if (usedByActor >= selectedAction.usesPerGame) {
        showAlert("سقف توانایی", `این توانایی برای این بازیکن قبلاً ${selectedAction.usesPerGame} بار ثبت شده است.`, "warning");
        return;
      }
    }
    if (eventWasUsed && selectedAction.usesPerNight && actorPlayerId) {
      const usedThisNight = comparableNightEvents.filter(
        (event) =>
          event.wasUsed !== false &&
          event.nightNumber === nightNumber &&
          event.abilityKey === selectedAction.key &&
          event.actorPlayer?.id === actorPlayerId
      ).length;
      if (usedThisNight >= selectedAction.usesPerNight) {
        showAlert("سقف شب", `این توانایی در شب ${nightNumber} برای این بازیکن به سقف ${selectedAction.usesPerNight} رسیده است.`, "warning");
        return;
      }
    }
    if (eventWasUsed && !usesTargetSlotChoices && selectedChoice?.usesPerGame && actorPlayerId) {
      const usedChoice = comparableNightEvents.filter(
        (event) =>
          event.wasUsed !== false &&
          event.abilityKey === selectedAction.key &&
          event.abilityChoiceKey === selectedChoice.id &&
          event.actorPlayer?.id === actorPlayerId
      ).length;
      if (usedChoice >= selectedChoice.usesPerGame) {
        showAlert("سقف انتخاب", `${selectedChoice.label} برای این بازیکن قبلاً ${selectedChoice.usesPerGame} بار ثبت شده است.`, "warning");
        return;
      }
    }
    if (eventWasUsed && selectedAction.selfTargetLimit !== null && actorPlayerId && selectedTargets.includes(actorPlayerId)) {
      const selfUses = comparableNightEvents.filter(
        (event) =>
          event.wasUsed !== false &&
          event.abilityKey === selectedAction.key &&
          event.actorPlayer?.id === actorPlayerId &&
          (
            event.targetPlayer?.id === actorPlayerId ||
            event.details?.secondaryTargetPlayerId === actorPlayerId ||
            (Array.isArray(event.details?.extraTargets) && event.details.extraTargets.some((target) => target.id === actorPlayerId))
          )
      ).length;
      if (selfUses >= selectedAction.selfTargetLimit) {
        showAlert(
          "سقف استفاده روی خود",
          selectedAction.selfTargetLimit === 0
            ? "این نقش در این تنظیمات نمی‌تواند روی خودش استفاده شود."
            : `این نقش فقط ${selectedAction.selfTargetLimit} بار می‌تواند روی خودش استفاده کند.`,
          "warning"
        );
        return;
      }
    }

    setBusy(true);
    const payload = {
      nightNumber,
      abilityKey: selectedAction.key,
      abilityLabel: selectedAction.label,
      abilityChoiceKey: !usesTargetSlotChoices ? selectedChoice?.id || null : null,
      abilityChoiceLabel: !usesTargetSlotChoices ? selectedChoice?.label || null : null,
      abilitySource: selectedAction.source === "side" ? selectedAction.sourceLabel : selectedAction.sourceLabel,
      actorPlayerId: actorPlayerId || null,
      targetPlayerId: eventWasUsed ? targetPlayerId : null,
      secondaryTargetPlayerId: eventWasUsed ? secondaryTargetPlayerId || null : null,
      extraTargetPlayerIds: eventWasUsed ? extraTargetPlayerIds.slice(0, extraTargetSlots).filter(Boolean) : [],
      targetLabels: eventWasUsed && usesTargetSlotChoices
        ? selectedAction.choices.slice(0, selectedTargetCount).map((choice) => choice.label)
        : [],
      targetCount: eventWasUsed ? selectedTargetCount : 1,
      convertedRoleId: eventWasUsed && needsConversionRole ? convertedRoleId : null,
      effectType: selectedEffectType,
      actorAlignment: selectedAction.actorAlignment || null,
      wasUsed: eventWasUsed,
      note: nightNote,
    };
    const result = editingEventId
      ? await updateNightEventRecord(gameId, editingEventId, payload)
      : await recordNightEvent(gameId, payload);

    if (result.success) {
      showToast(editingEventId ? "رکورد شب ویرایش شد" : "رکورد شب ثبت شد", "success");
      setTargetPlayerId("");
      setSecondaryTargetPlayerId("");
      setExtraTargetPlayerIds([]);
      setNightNote("");
      setEventWasUsed(true);
      setEditingEventId(null);
      setReportModalOpen(false);
      setPlayerPicker(null);
      await refreshGame();
    } else {
      showAlert("خطا", result.error || "ثبت اتفاق شب انجام نشد", "error");
    }
    setBusy(false);
  };

  const handleRecordDayElimination = async () => {
    const isVoteRecord = dayMethodKey === "vote";
    if (!isVoteRecord && !dayTargetPlayerId) {
      showAlert("حذف روز", "بازیکن حذف‌شده در روز را انتخاب کنید.", "warning");
      return;
    }
    if (isVoteRecord && dayDefensePlayerIds.length === 0 && !dayTargetPlayerId) {
      showAlert("رای‌گیری روز", "بازیکنان دفاع یا بازیکن حذف‌شده را انتخاب کنید.", "warning");
      return;
    }

    const preset = DAY_ELIMINATION_METHODS.find((method) => method.key === dayMethodKey);
    const methodLabel = dayMethodKey === "custom" ? customDayMethod.trim() : preset?.label || "حذف روز";
    if (!methodLabel) {
      showAlert("روش حذف", "برای روش سناریویی یک عنوان کوتاه وارد کنید.", "warning");
      return;
    }

    setBusy(true);
    const payload = {
      dayNumber,
      targetPlayerId: dayTargetPlayerId || null,
      methodKey: dayMethodKey,
      methodLabel,
      defensePlayerIds: isVoteRecord ? dayDefensePlayerIds : [],
      note: dayNote,
    };
    const result = editingEventId
      ? await updateDayEventRecord(gameId, editingEventId, payload)
      : await recordDayElimination(gameId, payload);

    if (result.success) {
      showToast(editingEventId ? "رکورد روز ویرایش شد" : dayTargetPlayerId ? "حذف روز در گزارش ثبت شد" : "دفاع‌های رای‌گیری ثبت شد", "success");
      setDayTargetPlayerId("");
      setDayDefensePlayerIds([]);
      setCustomDayMethod("");
      setDayNote("");
      setEditingEventId(null);
      setReportModalOpen(false);
      setPlayerPicker(null);
      setReportMode("NIGHT");
      setNightNumber((current) => Math.max(current, dayNumber));
      await refreshGame();
    } else {
      showAlert("خطا", result.error || "ثبت حذف روز انجام نشد", "error");
    }
    setBusy(false);
  };

  const handleDeleteNightEvent = (event: NightEventRecord) => {
    showConfirm("حذف رکورد شب", "این رکورد از دفترچه گرداننده حذف شود؟", async () => {
      setBusy(true);
      const result = await deleteNightEvent(gameId, event.id);
      if (result.success) {
        showToast("رکورد شب حذف شد", "success");
        await refreshGame();
      } else {
        showAlert("خطا", result.error || "حذف رکورد انجام نشد", "error");
      }
      setBusy(false);
    }, "error");
  };

  const handleEndGame = (winner: Alignment | "UNKNOWN") => {
    const winnerLabel = winner === "UNKNOWN" ? "نامشخص" : alignmentLabel(winner);
    showConfirm("پایان بازی", `بازی با نتیجه ${winnerLabel} بسته شود؟`, async () => {
      setBusy(true);
      const result = await endGame(gameId, winner);
      if (result.success) {
        showToast(winner === "UNKNOWN" ? "بازی با نتیجه نامشخص بسته شد" : `بازی با پیروزی ${winnerLabel} پایان یافت`, "success");
        await refreshGame();
      } else {
        showAlert("خطا", result.error || "پایان بازی انجام نشد", "error");
      }
      setBusy(false);
    }, winner === "MAFIA" || winner === "UNKNOWN" ? "error" : "warning");
  };

  const handlePublishNightRecords = () => {
    showConfirm("عمومی کردن رکورد شب", "بازیکنان بعد از بازی می‌توانند اتفاقات ثبت‌شده شب را ببینند. ادامه می‌دهید؟", async () => {
      setBusy(true);
      const result = await publishNightRecords(gameId);
      if (result.success) {
        showToast("رکوردهای شب عمومی شدند", "success");
        await refreshGame();
      } else {
        showAlert("خطا", result.error || "عمومی کردن رکوردها انجام نشد", "error");
      }
      setBusy(false);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[560px] items-center justify-center" dir="rtl">
        <div className="pm-card w-full max-w-xl overflow-hidden text-center">
          <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-300" />
          <div className="p-8 sm:p-10">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-300 text-amber-950 shadow-lg shadow-amber-500/20">
              <span className="material-symbols-outlined animate-spin text-3xl leading-none">progress_activity</span>
            </div>
            <p className="mt-5 text-lg font-black text-[var(--pm-text)]">در حال آماده‌سازی اتاق گرداننده</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--pm-muted)]">
              نقش‌ها، تایمرها و دفترچه گزارش بازی برای اجرای دقیق هماهنگ می‌شوند.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-40 md:pb-20" dir="rtl">
      <header className="pm-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--pm-line)] bg-zinc-50/80 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="pm-icon-primary size-11">
              <span className="material-symbols-outlined text-2xl">shield_person</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">اتاق گرداننده</p>
              <h1 className="mt-1 truncate text-xl font-black text-[var(--pm-text)] sm:text-2xl">{game?.name || "بازی مافیا"}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-[var(--pm-line)] bg-white px-3 py-2 font-mono text-xs font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-300">
              #{game?.code || gameId.slice(0, 6).toUpperCase()}
            </span>
            <span className={`rounded-lg border px-3 py-2 text-xs font-black ${game?.status === "FINISHED" ? "border-zinc-500/20 bg-zinc-500/10 text-[var(--pm-muted)]" : "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]"}`}>
              {game?.status === "FINISHED" ? "پایان یافته" : "در جریان"}
            </span>
            <Link href="/dashboard/moderator" className="pm-button-secondary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">arrow_forward</span>
              بازگشت
            </Link>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            ["سناریو", game?.scenario?.name || "نامشخص", "account_tree", "text-[var(--pm-primary)]"],
            ["فعال", `${alivePlayers.length}/${players.length}`, "sensors", "text-emerald-500"],
            ["حذف‌شده", `${eliminatedPlayers.length}`, "person_off", "text-red-500"],
            ["گزارش‌ها", `${nightEvents.length}`, "edit_note", "text-sky-500"],
          ].map(([label, value, icon, color]) => (
            <div
              key={label}
              className="flex min-w-max items-center gap-2 rounded-lg border border-[var(--pm-line)] bg-white px-3 py-2 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/60"
            >
              <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
              <span className="text-xs font-black text-[var(--pm-muted)]">{label}</span>
              <span className="max-w-44 truncate text-sm font-black text-[var(--pm-text)]">{value}</span>
            </div>
          ))}
        </div>
      </header>

      {game?.status !== "FINISHED" && (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.85rem)] z-40 grid grid-cols-[1fr_1fr_44px] gap-2 md:hidden">
          <button
            type="button"
            onClick={() => openReportChooser("DAY")}
            disabled={busy}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-black shadow-lg backdrop-blur transition-all disabled:opacity-50 ${
              reportMode === "DAY"
                ? "border-amber-500/30 bg-amber-400 text-zinc-950 shadow-amber-500/15"
                : "border-[var(--pm-line)] bg-[var(--pm-surface)]/94 text-[var(--pm-text)] shadow-zinc-950/10"
            }`}
          >
            <span className="material-symbols-outlined text-lg">wb_sunny</span>
            روز
          </button>
          <button
            type="button"
            onClick={() => openReportChooser("NIGHT")}
            disabled={busy}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-black shadow-lg backdrop-blur transition-all disabled:opacity-50 ${
              reportMode === "NIGHT"
                ? "border-sky-500/30 bg-sky-500 text-white shadow-sky-500/15"
                : "border-[var(--pm-line)] bg-[var(--pm-surface)]/94 text-[var(--pm-text)] shadow-zinc-950/10"
            }`}
          >
            <span className="material-symbols-outlined text-lg">dark_mode</span>
            شب
          </button>
          <button
            type="button"
            onClick={finishCurrentPhase}
            disabled={busy}
            className="flex min-h-11 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface)]/94 text-[var(--pm-text)] shadow-lg shadow-zinc-950/10 backdrop-blur transition-all hover:bg-[var(--pm-surface-soft)] disabled:opacity-50"
            aria-label={`پایان ${activePhaseLabel}`}
          >
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>
      )}

      <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <section className="space-y-5">
          <div className="pm-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">وضعیت بازیکنان</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">بازیکنان و نقش‌ها</h2>
              </div>
              <span className="rounded-lg border border-[var(--pm-line)] bg-white px-3 py-1 text-xs font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-[var(--pm-muted)]">
                {players.length} نفر
              </span>
            </div>

            <div className="p-4">
              <div className="mb-4 grid gap-2 sm:grid-cols-3">
                {[
                  ["کل بازیکنان", players.length, "groups", "text-[var(--pm-muted)]"],
                  ["فعال", alivePlayers.length, "sensors", "text-[var(--pm-primary)] dark:text-[var(--pm-primary)]"],
                  ["حذف‌شده", eliminatedPlayers.length, "person_off", "text-red-600 dark:text-red-300"],
                ].map(([label, value, icon, color]) => (
                  <div key={String(label)} className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
                      <span className="text-lg font-black text-[var(--pm-text)]">{value}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--pm-line)] bg-white shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/60">
              {displayPlayers.map((player, index) => {
                const alive = player.isAlive !== false;
                const image = playerImage(player);
                const joinedViaTelegram = player.joinSource === "TELEGRAM";
                return (
                  <article
                    key={player.id}
                    className={`relative overflow-hidden border-b border-[var(--pm-line)] p-3 transition-all last:border-b-0 dark:border-[var(--pm-line)] ${
                      joinedViaTelegram && alive
                        ? "bg-sky-500/10 hover:bg-sky-500/[0.14]"
                        : alive
                        ? "bg-white hover:bg-[var(--pm-primary)]/[0.04] dark:bg-transparent dark:hover:bg-white/[0.04]"
                        : "bg-red-500/10"
                    }`}
                  >
                    <div className={`absolute inset-y-3 right-0 w-1 rounded-l-full ${joinedViaTelegram && alive ? "bg-sky-500" : alive ? "bg-[var(--pm-primary)]" : "bg-red-500"}`} />
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_118px] lg:items-center">
                      <div className="flex min-w-0 items-center gap-3 pr-1">
                        <div className={`relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base font-black shadow-sm shadow-zinc-950/10 ${alive ? joinedViaTelegram ? "bg-sky-500 text-white" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-red-500 text-white"}`}>
                          {image ? <img src={image} alt="" className="size-full object-cover" /> : getInitial(player.name)}
                          <span className={`absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white text-[10px] dark:border-zinc-950 ${joinedViaTelegram && alive ? "bg-sky-500 text-white" : alive ? "bg-[var(--pm-primary)]" : "bg-red-500"}`}>
                            {joinedViaTelegram && alive ? <span className="material-symbols-outlined text-[12px]">send</span> : null}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`truncate text-base font-black ${joinedViaTelegram ? "text-sky-700 dark:text-sky-300" : "text-[var(--pm-text)]"}`}>{player.name}</p>
                            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black ${alive ? "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]" : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"}`}>
                              {alive ? "فعال" : "حذف‌شده"}
                            </span>
                            {joinedViaTelegram && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-black text-sky-700 dark:text-sky-300">
                                <span className="material-symbols-outlined text-xs">send</span>
                                تلگرام
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">ردیف ورود #{index + 1}</p>
                        </div>
                      </div>

                      <div className={`rounded-lg border p-3 ${alignmentClass(player.role?.alignment)}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-black">{player.role?.name || "بدون نقش"}</p>
                          <span className="material-symbols-outlined text-lg">{alignmentIcon(player.role?.alignment)}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs leading-5 opacity-80">
                          {player.role?.description || "توضیحی ثبت نشده است."}
                        </p>
                      </div>

                      <button
                        onClick={() => handleTogglePlayer(player)}
                        disabled={busy}
                        className={alive ? "pm-button-secondary min-h-10 w-full text-red-600 dark:text-red-300" : "pm-button-secondary min-h-10 w-full text-[var(--pm-primary)]"}
                      >
                        <span className="material-symbols-outlined text-lg">{alive ? "person_off" : "person_add"}</span>
                        {alive ? "ثبت حذف" : "بازگرداندن"}
                      </button>
                    </div>
                  </article>
                );
              })}
              </div>
            </div>
          </div>

          <MobilePwaFeatureLock
            icon="edit_note"
            title="ثبت گزارش بازی در PWA موبایل فعال است"
            description="روی گوشی داخل مرورگر، گزارش روز و شب قفل می‌شود تا انتخاب بازیکن، پنجره‌ها و ذخیره رکوردها پایدار و تمام‌صفحه باشند."
          >
          <div className="pm-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">دفترچه گرداننده</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">گزارش مرحله‌ای بازی</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {game?.status !== "FINISHED" && (
                  <button
                    type="button"
                    onClick={() => openReportChooser(reportMode)}
                    disabled={busy}
                    className="pm-button-primary min-h-10 px-3 text-xs"
                  >
                    <span className="material-symbols-outlined text-base">add_notes</span>
                    ثبت اتفاق
                  </button>
                )}
                {game?.status === "FINISHED" && nightEvents.length > 0 && (
                  <button
                    onClick={handlePublishNightRecords}
                    disabled={busy || game?.nightRecordsPublic}
                    className={game?.nightRecordsPublic ? "pm-button-secondary min-h-10 px-3 text-xs text-[var(--pm-primary)]" : "pm-button-primary min-h-10 px-3 text-xs"}
                  >
                    <span className="material-symbols-outlined text-base">{game?.nightRecordsPublic ? "public" : "publish"}</span>
                    {game?.nightRecordsPublic ? "گزارش منتشر شده" : "انتشار گزارش برای بازیکنان"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                <div>
                  <p className="text-sm font-black text-[var(--pm-text)]">خط زمانی بازی</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--pm-muted)]">
                    هر اتفاق با زبان گزارش نهایی ثبت می‌شود: چه کسی اقدام کرد، هدف چه کسی بود و نتیجه چه شد.
                  </p>
                </div>

                <div className={`mt-4 rounded-lg border p-3 ${reportMode === "DAY" ? "border-amber-500/25 bg-amber-500/10" : "border-sky-500/25 bg-sky-500/10"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--pm-muted)]">مرحله در حال ثبت</p>
                      <p className="mt-1 text-lg font-black text-[var(--pm-text)]">{activePhaseLabel}</p>
                      <p className="mt-1 text-[10px] font-bold leading-5 text-[var(--pm-muted)]">
                        {reportMode === "DAY" ? `دفاع‌ها، رای نهایی یا حذف روز ${dayNumber} را ثبت کنید؛ بعد شب ${dayNumber} فعال می‌شود.` : `اکشن‌ها، شات، نجات یا تبدیل شب ${nightNumber} را ثبت کنید؛ بعد روز ${nightNumber + 1} فعال می‌شود.`}
                      </p>
                    </div>
                    <span className={`material-symbols-outlined text-2xl ${reportMode === "DAY" ? "text-amber-600 dark:text-amber-300" : "text-sky-600 dark:text-sky-300"}`}>
                      {reportMode === "DAY" ? "wb_sunny" : "dark_mode"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={finishCurrentPhase}
                    disabled={busy}
                    className="mt-3 min-h-10 w-full rounded-lg border border-[var(--pm-line)] bg-white px-3 text-xs font-black text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-50 dark:border-[var(--pm-line)] dark:bg-zinc-950/60 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    پایان {activePhaseLabel} و شروع {nextPhaseLabel}
                  </button>
                </div>

                <div className="mt-4 rounded-lg border border-[var(--pm-line)] bg-white p-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/60">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-[var(--pm-text)]">ترتیب مرحله‌ها</p>
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-black text-[var(--pm-muted)] dark:bg-white/10 dark:text-zinc-300">
                      مرحله بعد: {nextPhaseLabel}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {chronologicalPhases.map((phase, index) => (
                      <div
                        key={phase.key}
                        className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                          phase.active
                            ? phase.type === "DAY"
                              ? "border-amber-500/35 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                              : "border-sky-500/30 bg-sky-500/10 shadow-sm shadow-sky-500/10"
                            : "border-[var(--pm-line)] bg-zinc-50/80 dark:border-[var(--pm-line)] dark:bg-white/[0.03]"
                        }`}
                      >
                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${phase.active ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-[var(--pm-muted)] dark:bg-zinc-950/70 dark:text-zinc-300"}`}>
                          {index + 1}
                        </span>
                        <span className={`material-symbols-outlined text-lg ${phase.type === "DAY" ? "text-amber-600 dark:text-amber-300" : "text-sky-600 dark:text-sky-300"}`}>
                          {phase.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-[var(--pm-text)]">{phase.label}</p>
                          <p className="truncate text-[10px] font-bold text-[var(--pm-muted)]">
                            {phase.active ? "اکنون در حال ثبت همین مرحله هستید" : phase.nextLabel}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-black ${phase.events.length ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-zinc-100 text-[var(--pm-muted)] dark:bg-white/5 dark:text-[var(--pm-muted)]"}`}>
                          {phase.events.length} اتفاق
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {reportMode === "DAY" ? (
                  <div className="rounded-lg border border-amber-500/20 bg-white p-3 dark:border-amber-500/20 dark:bg-zinc-950/50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-[var(--pm-text)]">حذف یا اتفاق روز</p>
                      <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">روز {dayNumber}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {DAY_ELIMINATION_METHODS.map((method) => (
                        <button
                          key={method.key}
                          type="button"
                          onClick={() => openDayRecord(method.key)}
                          disabled={busy}
                          className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-amber-500/15 bg-amber-500/10 px-2 text-[10px] font-black text-amber-700 transition-all hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-300"
                        >
                          <span className="material-symbols-outlined text-sm">{method.icon}</span>
                          {method.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1">
                      {displayPlayers.map((player) => {
                        const image = playerImage(player);
                        return (
                          <button
                            key={`day-${player.id}`}
                            type="button"
                            onClick={() => openDayRecord(dayMethodKey, player.id)}
                            disabled={busy}
                            className="flex min-h-12 items-center gap-2 rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-2 text-right transition-all hover:border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50 dark:border-[var(--pm-line)] dark:bg-white/[0.03]"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
                              {image ? <img src={image} alt="" className="size-full object-cover" /> : getInitial(player.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-black text-[var(--pm-text)]">{player.name}</span>
                              <span className="block truncate text-[10px] font-bold text-[var(--pm-muted)]">{player.role?.name || "بدون نقش"}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  ) : (
                  <div className="rounded-xl border border-sky-500/20 bg-white p-4 shadow-sm shadow-sky-500/10 dark:border-sky-500/20 dark:bg-zinc-950/50">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-[var(--pm-text)]">اتفاقات شب</p>
                        <p className="mt-1 text-[10px] font-bold leading-5 text-[var(--pm-muted)]">روی نام کوچک بازیکن زیر هر نقش بزنید تا پنجره ثبت اتفاق همان نقش باز شود.</p>
                      </div>
                      <span className="rounded-md bg-sky-500/15 px-2 py-1 text-[10px] font-black text-sky-700 dark:text-sky-300">شب {nightNumber}</span>
                    </div>
                    {mafiaShotAction && (
                      <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-red-700 dark:text-red-300">تصمیم جبهه مافیا</p>
                            <p className="mt-1 text-[10px] font-bold leading-5 text-red-700/80 dark:text-red-300/80">اگر یاکوزا، خریداری یا ناتو استفاده شده، «شات نداریم» را ثبت کنید.</p>
                          </div>
                          <span className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500 text-xl text-white">target</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openNightAction(mafiaShotAction, null, true)}
                          disabled={busy}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-2 text-xs font-black text-white shadow-sm shadow-red-500/20 transition-all hover:bg-red-600 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-base">target</span>
                          شلیک مافیا
                        </button>
                        <button
                          type="button"
                          onClick={() => openNightAction(mafiaShotAction, null, false)}
                          disabled={busy}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-white/75 px-2 text-xs font-black text-red-700 transition-all hover:bg-white disabled:opacity-50 dark:bg-zinc-950/40 dark:text-red-300"
                        >
                          <span className="material-symbols-outlined text-base">block</span>
                          شات نداریم
                        </button>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 grid max-h-[440px] gap-3 overflow-y-auto pr-1">
                      {roleActionOptions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--pm-line)] bg-zinc-50 p-4 text-xs font-bold text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                          برای نقش‌های این بازی توانایی شب فعال نشده است.
                        </div>
                      ) : (
                        roleActionOptions.map((option) => (
                          <div key={option.key} className={`overflow-hidden rounded-xl border shadow-sm shadow-zinc-950/5 ${option.className}`}>
                            <div className="flex items-start justify-between gap-3 border-b border-current/10 p-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-black">{option.sourceLabel}</p>
                                  <span className="rounded-md bg-white/60 px-2 py-0.5 text-[10px] font-black text-zinc-700 dark:bg-zinc-950/35 dark:text-white">
                                    {option.candidates.length} بازیکن
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-black opacity-90">{option.label}</p>
                                <p className="mt-1 text-[10px] font-bold leading-5 opacity-75">{abilityCompactLabel(option)}</p>
                              </div>
                              <span className="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/65 text-lg dark:bg-zinc-950/35">{option.effectType === "NONE" ? "auto_fix_high" : "hub"}</span>
                            </div>
                            <div className="grid gap-2 p-3 sm:grid-cols-2">
                              {option.candidates.map((player) => {
                                const image = playerImage(player);
                                return (
                                  <button
                                    key={`${option.key}-${player.id}`}
                                    type="button"
                                    onClick={() => openNightAction(option, player, true)}
                                    disabled={busy}
                                    className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-white/70 bg-white/75 px-2.5 text-right text-[11px] font-black text-zinc-800 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-zinc-950/10 disabled:opacity-50 dark:border-[var(--pm-line)] dark:bg-zinc-950/35 dark:text-white"
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-950 text-[10px] text-white dark:bg-white dark:text-zinc-950">
                                        {image ? <img src={image} alt="" className="size-full object-cover" /> : getInitial(player.name)}
                                      </span>
                                      <span className="min-w-0">
                                        <span className="block truncate">{player.name}</span>
                                        <span className="block truncate text-[9px] font-bold opacity-70">ثبت اتفاق</span>
                                      </span>
                                    </span>
                                    <span className="material-symbols-outlined text-base opacity-70">open_in_new</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  )}
                </div>

                {reportChooserOpen && (
                  <div
                    className="fixed inset-0 z-[115] flex items-end justify-center bg-zinc-950/65 p-3 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] backdrop-blur-sm md:items-center md:pb-3"
                    onClick={() => setReportChooserOpen(false)}
                  >
                    <section
                      className="flex max-h-[calc(100dvh-8rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--pm-line)] bg-white shadow-2xl shadow-zinc-950/30 dark:border-[var(--pm-line)] dark:bg-zinc-950 md:max-h-[calc(100dvh-2rem)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--pm-line)] bg-zinc-50/90 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">ثبت سریع گزارش</p>
                          <h3 className="mt-1 truncate text-lg font-black text-[var(--pm-text)]">انتخاب اتفاق برای {chooserPhaseLabel}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportChooserOpen(false)}
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-white text-[var(--pm-muted)] transition-all hover:bg-zinc-100 dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10"
                          aria-label="بستن انتخاب اتفاق"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      </div>

                      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--pm-line)] bg-zinc-100 p-1 dark:border-[var(--pm-line)] dark:bg-white/[0.04]">
                          {[
                            { mode: "DAY" as const, label: `روز ${dayNumber}`, icon: "wb_sunny" },
                            { mode: "NIGHT" as const, label: `شب ${nightNumber}`, icon: "dark_mode" },
                          ].map((item) => (
                            <button
                              key={item.mode}
                              type="button"
                              onClick={() => setReportMode(item.mode)}
                              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-black transition-all ${
                                reportMode === item.mode
                                  ? item.mode === "DAY"
                                    ? "bg-amber-400 text-zinc-950 shadow-sm shadow-amber-500/20"
                                    : "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                                  : "text-[var(--pm-muted)] hover:bg-white/70 dark:hover:bg-zinc-950/50"
                              }`}
                            >
                              <span className="material-symbols-outlined text-lg">{item.icon}</span>
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {reportMode === "DAY" ? (
                          <>
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                              <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-xl text-zinc-950">how_to_vote</span>
                                <div>
                                  <p className="text-sm font-black text-[var(--pm-text)]">اول نوع اتفاق روز را انتخاب کنید</p>
                                  <p className="mt-1 text-xs font-bold leading-5 text-amber-700 dark:text-amber-300">
                                    بعد از انتخاب، پنجره جزئیات باز می‌شود تا دفاع‌ها، حذف‌شده یا یادداشت را تکمیل کنید.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              {DAY_ELIMINATION_METHODS.map((method) => (
                                <button
                                  key={`chooser-day-method-${method.key}`}
                                  type="button"
                                  onClick={() => openDayRecord(method.key)}
                                  disabled={busy}
                                  className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-white p-3 text-right transition-all hover:-translate-y-0.5 hover:border-amber-500/35 hover:bg-amber-500/10 disabled:opacity-50 dark:bg-zinc-950/50"
                                >
                                  <span className="flex min-w-0 items-center gap-3">
                                    <span className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-xl text-amber-700 dark:text-amber-300">{method.icon}</span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-black text-[var(--pm-text)]">{method.label}</span>
                                      <span className="mt-0.5 block truncate text-[10px] font-bold text-[var(--pm-muted)]">باز کردن فرم {method.label}</span>
                                    </span>
                                  </span>
                                  <span className="material-symbols-outlined text-lg text-[var(--pm-muted)]">arrow_back</span>
                                </button>
                              ))}
                            </div>

                            <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-black text-[var(--pm-text)]">انتخاب مستقیم حذف‌شده</p>
                                  <p className="mt-1 text-[10px] font-bold leading-5 text-[var(--pm-muted)]">با روش فعلی: {DAY_ELIMINATION_METHODS.find((method) => method.key === dayMethodKey)?.label || "روش سناریویی"}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openDayRecord("vote")}
                                  disabled={busy}
                                  className="pm-button-secondary min-h-9 shrink-0 px-3 text-[10px]"
                                >
                                  <span className="material-symbols-outlined text-base">groups</span>
                                  دفاع
                                </button>
                              </div>
                              <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                {alivePlayers.map((player) => {
                                  const image = playerImage(player);
                                  return (
                                    <button
                                      key={`chooser-day-player-${player.id}`}
                                      type="button"
                                      onClick={() => openDayRecord(dayMethodKey, player.id)}
                                      disabled={busy}
                                      className="flex min-h-14 items-center gap-3 rounded-lg border border-[var(--pm-line)] bg-white p-2 text-right transition-all hover:border-amber-500/35 hover:bg-amber-500/10 disabled:opacity-50 dark:border-[var(--pm-line)] dark:bg-zinc-950/55"
                                    >
                                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
                                        {image ? <img src={image} alt="" className="size-full object-cover" /> : getInitial(player.name)}
                                      </span>
                                      <span className="min-w-0">
                                        <span className="block truncate text-sm font-black text-[var(--pm-text)]">{player.name}</span>
                                        <span className="block truncate text-[10px] font-bold text-[var(--pm-muted)]">{player.role?.name || "بدون نقش"}</span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
                              <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-xl text-white">dark_mode</span>
                                <div>
                                  <p className="text-sm font-black text-[var(--pm-text)]">اقدام شب را از روی نقش یا جبهه انتخاب کنید</p>
                                  <p className="mt-1 text-xs font-bold leading-5 text-sky-700 dark:text-sky-300">
                                    بعد از انتخاب بازیکن انجام‌دهنده، پنجره جزئیات برای هدف‌ها و نتیجه باز می‌شود.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {mafiaShotAction && (
                              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-black text-red-700 dark:text-red-300">تصمیم جبهه مافیا</p>
                                    <p className="mt-1 text-[10px] font-bold leading-5 text-red-700/80 dark:text-red-300/80">برای شلیک عادی یا شب بدون شات ثبت کنید.</p>
                                  </div>
                                  <span className="material-symbols-outlined text-2xl text-red-600 dark:text-red-300">target</span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openNightAction(mafiaShotAction, null, true)}
                                    disabled={busy}
                                    className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-500 px-3 text-xs font-black text-white shadow-sm shadow-red-500/20 transition-all hover:bg-red-600 disabled:opacity-50"
                                  >
                                    <span className="material-symbols-outlined text-lg">target</span>
                                    شلیک
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openNightAction(mafiaShotAction, null, false)}
                                    disabled={busy}
                                    className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-white px-3 text-xs font-black text-red-700 transition-all hover:bg-red-50 disabled:opacity-50 dark:bg-zinc-950/50 dark:text-red-300 dark:hover:bg-red-500/10"
                                  >
                                    <span className="material-symbols-outlined text-lg">block</span>
                                    بدون شات
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="grid gap-3">
                              {roleActionOptions.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-[var(--pm-line)] bg-zinc-50 p-4 text-xs font-bold text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                                  برای نقش‌های این بازی توانایی شب فعال نشده است.
                                </div>
                              ) : (
                                roleActionOptions.map((option) => (
                                  <div key={`chooser-${option.key}`} className={`overflow-hidden rounded-lg border ${option.className}`}>
                                    <div className="flex items-start justify-between gap-3 border-b border-current/10 p-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-black">{option.sourceLabel}</p>
                                        <p className="mt-1 text-xs font-bold opacity-85">{option.label} | {abilityCompactLabel(option)}</p>
                                      </div>
                                      <span className="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/60 text-lg dark:bg-zinc-950/35">{option.effectType === "NONE" ? "auto_fix_high" : "hub"}</span>
                                    </div>
                                    <div className="grid gap-2 p-3 sm:grid-cols-2">
                                      {option.candidates.map((player) => {
                                        const image = playerImage(player);
                                        return (
                                          <button
                                            key={`chooser-${option.key}-${player.id}`}
                                            type="button"
                                            onClick={() => openNightAction(option, player, true)}
                                            disabled={busy}
                                            className="flex min-h-14 items-center justify-between gap-2 rounded-lg border border-white/70 bg-white/75 p-2.5 text-right text-xs font-black text-zinc-800 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-zinc-950/10 disabled:opacity-50 dark:border-[var(--pm-line)] dark:bg-zinc-950/35 dark:text-white"
                                          >
                                            <span className="flex min-w-0 items-center gap-2">
                                              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950 text-xs text-white dark:bg-white dark:text-zinc-950">
                                                {image ? <img src={image} alt="" className="size-full object-cover" /> : getInitial(player.name)}
                                              </span>
                                              <span className="min-w-0">
                                                <span className="block truncate">{player.name}</span>
                                                <span className="block truncate text-[10px] font-bold opacity-70">انتخاب و تکمیل جزئیات</span>
                                              </span>
                                            </span>
                                            <span className="material-symbols-outlined text-base opacity-70">arrow_back</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {reportModalOpen && (
                  <div
                    className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/60 p-3 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] backdrop-blur-sm md:items-center md:pb-3"
                    onClick={() => {
                      setReportModalOpen(false);
                      setEditingEventId(null);
                      setPlayerPicker(null);
                    }}
                  >
                    <section
                      className="flex max-h-[calc(100dvh-8rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--pm-line)] bg-white shadow-2xl shadow-zinc-950/25 dark:border-[var(--pm-line)] dark:bg-zinc-950 md:max-h-[calc(100dvh-2rem)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--pm-line)] bg-zinc-50/90 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">{reportMode === "NIGHT" ? `شب ${nightNumber}` : `روز ${dayNumber}`}</p>
                          <h3 className="mt-1 truncate text-lg font-black text-[var(--pm-text)]">
                            {editingEventId
                              ? reportMode === "NIGHT" ? "ویرایش اتفاق شب" : "ویرایش اتفاق روز"
                              : reportMode === "NIGHT" ? "جزئیات اتفاق شب" : "جزئیات اتفاق روز"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReportModalOpen(false);
                            setEditingEventId(null);
                            setPlayerPicker(null);
                          }}
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-white text-[var(--pm-muted)] transition-all hover:bg-zinc-100 dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10"
                          aria-label="بستن"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      </div>
                      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
                  {reportMode === "NIGHT" ? (
                    <>
                  <div className={`rounded-lg border p-3 ${selectedAction?.source === "side" ? "border-red-500/20 bg-red-500/10" : selectedAction?.className || "border-[var(--pm-line)] bg-[var(--pm-surface-soft)]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[var(--pm-muted)]">{selectedAction?.source === "side" ? "جبهه مافیا" : selectedAction?.sourceLabel}</p>
                        <p className="mt-1 truncate text-base font-black text-[var(--pm-text)]">{selectedAction?.label || "اتفاق شب"}</p>
                      </div>
                      <span className="material-symbols-outlined text-xl">{selectedAction?.source === "side" ? "target" : "auto_fix_high"}</span>
                    </div>
                    {selectedAction?.source !== "side" && selectedAction && (
                      <p className="mt-2 text-[10px] font-bold leading-5 opacity-80">{abilityCompactLabel(selectedAction)}</p>
                    )}
                  </div>

                  {selectedAction?.choices.length > 0 && !usesTargetSlotChoices && (
                    <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-2 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                      <p className="mb-2 text-xs font-black text-[var(--pm-muted)]">نوع استفاده</p>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {selectedAction.choices.map((choice) => (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => setSelectedChoiceKey(choice.id)}
                            className={`min-h-10 rounded-lg border px-3 text-right text-xs font-black transition-all ${
                              selectedChoiceKey === choice.id
                                ? "border-[var(--pm-primary)]/40 bg-[var(--pm-primary)]/15 text-[var(--pm-primary)]"
                                : "border-[var(--pm-line)] bg-white text-[var(--pm-muted)] hover:border-[var(--pm-primary)]/30 dark:border-[var(--pm-line)] dark:bg-zinc-950/60 dark:text-zinc-300"
                            }`}
                          >
                            {choice.label}
                            <span className="mt-1 block text-[10px] font-bold opacity-70">{usageLabel(choice.usesPerGame)} | {effectLabel(choice.effectType)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {canChooseReportEffect ? (
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black text-[var(--pm-muted)]">نوع ثبت این اتفاق</span>
                      <select
                        value={reportEffectType}
                        onChange={(event) => {
                          setReportEffectType(event.target.value as AbilityEffectType);
                          setTargetPlayerId("");
                          setSecondaryTargetPlayerId("");
                          setExtraTargetPlayerIds([]);
                        }}
                      >
                        <option value="NONE">ثبت ساده</option>
                        <option value="CONVERT_TO_MAFIA">خریداری</option>
                        <option value="YAKUZA">یاکوزا</option>
                        <option value="TWO_NAME_INQUIRY">بازپرسی دو نفره</option>
                      </select>
                    </label>
                  ) : fixedEffectType !== "NONE" ? (
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-3 text-xs font-bold leading-6 text-sky-700 dark:text-sky-300">
                      نوع ثبت ثابت: {effectLabel(fixedEffectType)}
                    </div>
                  ) : null}

                  {selectedAction?.source === "side" && (
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--pm-line)] bg-white p-1 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                      {[
                        { value: true, label: "شات", icon: "target" },
                        { value: false, label: "بدون شات", icon: "block" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setEventWasUsed(item.value);
                            if (!item.value) {
                              setTargetPlayerId("");
                              setSecondaryTargetPlayerId("");
                              setExtraTargetPlayerIds([]);
                            }
                          }}
                          className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-black transition-all ${
                            eventWasUsed === item.value
                              ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                              : "text-[var(--pm-muted)] hover:bg-zinc-100 dark:text-[var(--pm-muted)] dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedAction?.source === "role" && actorPlayerId && (
                    <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                      <p className="text-xs font-black text-[var(--pm-muted)]">انجام‌دهنده</p>
                      <p className="mt-1 text-sm font-black text-[var(--pm-text)]">
                        {playerById(actorPlayerId)?.name || "بازیکن انتخاب‌شده"} | {playerById(actorPlayerId)?.role?.name || selectedAction.sourceLabel}
                      </p>
                    </div>
                  )}

                  {renderPlayerButton({
                    label: usesTargetSlotChoices
                      ? selectedAction.choices[0]?.label || "گزینه ۱"
                      : selectedEffectType === "TWO_NAME_INQUIRY"
                        ? "اسم اول"
                        : selectedEffectType === "YAKUZA"
                          ? "بازیکن خریداری‌شونده"
                          : "هدف",
                    value: targetPlayerId,
                    slot: "target",
                    options: targetPlayerOptions,
                    disabled: !eventWasUsed,
                    required: true,
                  })}

                  {showsSecondaryTarget && renderPlayerButton({
                    label: selectedEffectType === "YAKUZA"
                      ? "مافیای قربانی یاکوزا"
                      : usesTargetSlotChoices
                        ? selectedAction.choices[1]?.label || "گزینه ۲"
                        : selectedEffectType === "TWO_NAME_INQUIRY"
                          ? "اسم دوم بازپرسی"
                          : "هدف دوم اختیاری",
                    value: secondaryTargetPlayerId,
                    slot: "secondary",
                    options: secondaryTargetOptions,
                    disabled: !eventWasUsed,
                    required: needsSecondaryTarget,
                  })}

                  {extraTargetSlots > 0 && (
                    <div className="grid gap-2">
                      {Array.from({ length: extraTargetSlots }).map((_, index) => (
                        <div key={`extra-target-${index}`}>
                          {renderPlayerButton({
                            label: usesTargetSlotChoices ? selectedAction.choices[index + 2]?.label || `گزینه ${index + 3}` : `هدف ${index + 3} اختیاری`,
                            value: extraTargetPlayerIds[index] || "",
                            slot: "extra",
                            options: players,
                            index,
                            disabled: !eventWasUsed,
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {needsConversionRole && (
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black text-[var(--pm-muted)]">نقش مافیایی بعد از خریداری</span>
                      <select value={convertedRoleId} onChange={(event) => setConvertedRoleId(event.target.value)} disabled={!eventWasUsed}>
                        <option value="">انتخاب نقش مافیا</option>
                        {mafiaConversionRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {selectedEffectType !== "NONE" && (
                    <div className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-3 text-xs font-bold leading-6 text-[var(--pm-primary)]">
                      رفتار ثبت‌شده: {effectLabel(selectedEffectType)}
                    </div>
                  )}

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-[var(--pm-muted)]">یادداشت اختیاری</span>
                    <textarea
                      value={nightNote}
                      onChange={(event) => setNightNote(event.target.value.slice(0, 500))}
                      placeholder="مثلاً دکتر این بازیکن را نجات داد."
                      className="min-h-24 resize-none"
                    />
                  </label>

                  <button
                    onClick={handleRecordNightEvent}
                    disabled={busy}
                    className="pm-button-primary min-h-11 w-full"
                  >
                    <span className="material-symbols-outlined text-xl">add_notes</span>
                    {editingEventId ? `ذخیره ویرایش شب ${nightNumber}` : `ثبت در شب ${nightNumber}`}
                  </button>
                    </>
                  ) : (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xl text-zinc-950">wb_sunny</span>
                      <div>
                        <p className="text-sm font-black text-[var(--pm-text)]">ثبت حذف روز</p>
                        <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">رای‌گیری، شلیک روز، بازپرسی یا هر روش سناریویی.</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-amber-500/20 bg-white/70 p-1 dark:bg-zinc-950/50">
                      {DAY_ELIMINATION_METHODS.map((method) => (
                        <button
                          key={method.key}
                          type="button"
                          onClick={() => {
                            setDayMethodKey(method.key);
                            if (method.key !== "vote") setDayDefensePlayerIds([]);
                          }}
                          className={`flex min-h-9 items-center justify-center gap-1 rounded-lg text-[10px] font-black transition-all ${
                            dayMethodKey === method.key
                              ? "bg-amber-500 text-zinc-950 shadow-sm"
                              : "text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">{method.icon}</span>
                          {method.label}
                        </button>
                      ))}
                    </div>

                    {dayMethodKey === "custom" && (
                      <label className="mt-3 flex flex-col gap-2">
                        <span className="text-xs font-black text-amber-700 dark:text-amber-300">عنوان روش سناریویی</span>
                        <input
                          value={customDayMethod}
                          onChange={(event) => setCustomDayMethod(event.target.value.slice(0, 80))}
                          placeholder="مثلاً حکم قاضی یا چالش روز"
                          className="min-h-10 text-sm"
                        />
                      </label>
                    )}

                    {dayMethodKey === "vote" && (
                      <div className="mt-3 rounded-lg border border-amber-500/20 bg-white/70 p-3 dark:bg-zinc-950/50">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-amber-700 dark:text-amber-300">بازیکنان دفاع</p>
                            <p className="mt-1 text-[10px] font-bold leading-5 text-amber-700/80 dark:text-amber-300/80">
                              همه کسانی که رای کافی برای دفاع گرفته‌اند را انتخاب کنید.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openPlayerPicker({ slot: "defense", title: "بازیکنان دفاع", options: alivePlayers, multi: true })}
                            disabled={busy}
                            className="pm-button-secondary min-h-9 shrink-0 px-3 text-xs"
                          >
                            <span className="material-symbols-outlined text-base">groups</span>
                            انتخاب
                          </button>
                        </div>
                        {selectedDefensePlayers.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedDefensePlayers.map((player) => (
                              <button
                                key={`defense-chip-${player.id}`}
                                type="button"
                                onClick={() => setDayDefensePlayerIds((current) => current.filter((id) => id !== player.id))}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:text-amber-300"
                              >
                                <span>{player.name}</span>
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 rounded-lg border border-dashed border-amber-500/20 px-3 py-2 text-[11px] font-bold text-amber-700/70 dark:text-amber-300/70">
                            هنوز بازیکنی برای دفاع انتخاب نشده است.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-3">
                      {renderPlayerButton({
                        label: dayMethodKey === "vote" ? "بازیکن حذف‌شده بعد از دفاع (اختیاری)" : "بازیکن حذف‌شده",
                        value: dayTargetPlayerId,
                        slot: "day",
                        options: alivePlayers,
                        disabled: busy,
                        required: dayMethodKey !== "vote",
                      })}
                    </div>

                    <label className="mt-3 flex flex-col gap-2">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300">یادداشت روز</span>
                      <textarea
                        value={dayNote}
                        onChange={(event) => setDayNote(event.target.value.slice(0, 500))}
                        placeholder="مثلاً با رای‌گیری روز حذف شد."
                        className="min-h-20 resize-none text-sm"
                      />
                    </label>

                    <button
                      onClick={handleRecordDayElimination}
                      disabled={busy}
                      className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-black text-zinc-950 transition-all hover:bg-amber-400 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">{dayTargetPlayerId ? "person_remove" : "how_to_vote"}</span>
                      {editingEventId
                        ? `ذخیره ویرایش روز ${dayNumber}`
                        : dayTargetPlayerId ? `ثبت حذف روز ${dayNumber}` : `ثبت دفاع روز ${dayNumber}`}
                    </button>
                  </div>
                  )}
                      </div>
                    </section>
                  </div>
                )}
                {shotResolution && (
                  <div className="fixed inset-0 z-[140] flex items-end justify-center bg-zinc-950/70 p-3 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] backdrop-blur-sm md:items-center md:pb-3">
                    <section className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--pm-line)] bg-white shadow-2xl shadow-zinc-950/30 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                      <div className="border-b border-red-500/20 bg-red-500/10 p-4">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-2xl text-white">target</span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)] text-red-700 dark:text-red-300">پایان شب {nightNumber}</p>
                            <h3 className="mt-1 text-xl font-black text-[var(--pm-text)]">نتیجه شلیک مافیا</h3>
                            <p className="mt-2 text-sm font-bold leading-6 text-red-700/85 dark:text-red-300/85">
                              {shotResolution.player.name} هدف شلیک مافیا بود. آیا بعد از نجات دکتر یا اثر نقش‌ها کشته شد؟
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 p-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => resolveMafiaShot(true)}
                          disabled={busy}
                          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-black text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-xl">person_off</span>
                          کشته شد
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveMafiaShot(false)}
                          disabled={busy}
                          className="pm-button-secondary min-h-12 text-sm text-[var(--pm-primary)]"
                        >
                          <span className="material-symbols-outlined text-xl">health_and_safety</span>
                          زنده ماند
                        </button>
                      </div>
                    </section>
                  </div>
                )}
                {playerPicker && (
                  <div
                    className="fixed inset-0 z-[150] flex items-end justify-center bg-zinc-950/65 p-3 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] backdrop-blur-sm md:items-center md:pb-3"
                    onClick={() => setPlayerPicker(null)}
                  >
                    <section
                      className="flex max-h-[calc(100dvh-8rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[var(--pm-line)] bg-white shadow-2xl shadow-zinc-950/30 dark:border-[var(--pm-line)] dark:bg-zinc-950 md:max-h-[calc(100dvh-2rem)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--pm-line)] bg-zinc-50/90 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">انتخاب بازیکن</p>
                          <h3 className="mt-1 text-lg font-black text-[var(--pm-text)]">{playerPicker.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPlayerPicker(null)}
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-white text-[var(--pm-muted)] transition-all hover:bg-zinc-100 dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10"
                          aria-label="بستن انتخاب بازیکن"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      </div>
                      <div className="custom-scrollbar grid gap-2 overflow-y-auto p-4 sm:grid-cols-2">
                        {playerPicker.options.map((player) => {
                          const image = playerImage(player);
                          const alive = player.isAlive !== false;
                          const selected = playerPicker.slot === "defense" && dayDefensePlayerIds.includes(player.id);
                          return (
                            <button
                              key={`${playerPicker.slot}-${playerPicker.index ?? "main"}-${player.id}`}
                              type="button"
                              onClick={() => pickPlayer(player.id)}
                              className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 text-right transition-all hover:-translate-y-0.5 ${
                                selected
                                  ? "border-amber-500/35 bg-amber-500/15"
                                  : alive
                                  ? "border-[var(--pm-line)] bg-zinc-50 hover:border-[var(--pm-primary)]/40 hover:bg-[var(--pm-primary)]/10 dark:border-[var(--pm-line)] dark:bg-white/[0.03]"
                                  : "border-red-500/20 bg-red-500/10"
                              }`}
                            >
                              <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950 text-sm font-black text-white dark:bg-white dark:text-zinc-950">
                                {image ? <img src={image} alt="" className="size-full object-cover" /> : getInitial(player.name)}
                                <span className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white dark:border-zinc-950 ${alive ? "bg-[var(--pm-primary)]" : "bg-red-500"}`} />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-[var(--pm-text)]">{player.name}</span>
                                <span className="mt-0.5 block truncate text-xs font-bold text-[var(--pm-muted)]">
                                  {selected ? "انتخاب شده برای دفاع" : `${player.role?.name || "بدون نقش"} | ${alive ? "فعال" : "حذف‌شده"}`}
                                </span>
                              </span>
                              {selected && <span className="material-symbols-outlined mr-auto text-amber-600 dark:text-amber-300">check_circle</span>}
                            </button>
                          );
                        })}
                      </div>
                      {playerPicker.multi && (
                        <div className="border-t border-[var(--pm-line)] bg-zinc-50/90 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                          <button type="button" onClick={() => setPlayerPicker(null)} className="pm-button-primary min-h-10 w-full text-xs">
                            تایید انتخاب‌ها ({dayDefensePlayerIds.length})
                          </button>
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </aside>

              <section className="min-w-0">
                <GameReportTimeline
                  events={nightEvents}
                  title="گزارش اجرای بازی"
                  subtitle="متن گزارش حالا مثل روایت گرداننده نوشته می‌شود: اتفاق، عامل، هدف و نتیجه هر مرحله جدا و خوانا است."
                  isPublic={game?.nightRecordsPublic}
                  busy={busy}
                  onEdit={(event: GameReportEvent) => openEditReportEvent(event as NightEventRecord)}
                  onDelete={(event: GameReportEvent) => handleDeleteNightEvent(event as NightEventRecord)}
                />
              </section>
            </div>
          </div>
          </MobilePwaFeatureLock>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:h-fit">
          {game?.status !== "FINISHED" && (
            <MobilePwaFeatureLock
              compact
              icon="timer"
              title="تایمر گرداننده فقط در PWA موبایل"
              description="برای زنگ پایدارتر، لرزش و صفحه بدون نوار مرورگر، تایمر روی موبایل در نسخه نصب‌شده فعال است."
            >
              <ModeratorTimerBoard />
            </MobilePwaFeatureLock>
          )}

          <section className="pm-card overflow-hidden">
            <div className="border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">اتاق نتیجه</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">انتخاب برنده</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--pm-muted)]">
                اگر بازی بعد از ۸ ساعت بسته نشود، سیستم آن را با برنده نامشخص می‌بندد.
              </p>
            </div>

            <div className="grid gap-3 p-4">
              {[
                { key: "CITIZEN" as const, label: "پیروزی شهروندان", icon: "verified_user", className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
                { key: "MAFIA" as const, label: "پیروزی مافیا", icon: "local_police", className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300" },
                { key: "NEUTRAL" as const, label: "پیروزی مستقل‌ها", icon: "casino", className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
                { key: "UNKNOWN" as const, label: "برنده نامشخص", icon: "help", className: "border-zinc-300 bg-zinc-100 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.05] dark:text-zinc-300" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleEndGame(item.key)}
                  disabled={busy || game?.status === "FINISHED"}
                  className={`group flex min-h-16 items-center justify-between gap-3 rounded-lg border p-3 text-right transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 ${item.className}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined flex size-10 items-center justify-center rounded-lg bg-white/60 text-xl dark:bg-zinc-950/40">{item.icon}</span>
                    <span className="font-black">{item.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-lg opacity-60 transition-transform group-hover:-translate-x-1">arrow_back</span>
                </button>
              ))}
            </div>
          </section>

          <section className="pm-card p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">راهنمای اجرای سریع</p>
            <div className="mt-4 space-y-3">
              {[
                ["person_off", "حذف‌شده‌ها", "بازیکن حذف‌شده در صفحه بازی برای بقیه هم مشخص می‌شود."],
                ["dark_mode", "دفترچه شب", "ثبت اتفاق شب اختیاری است و تا وقتی عمومی نشود فقط برای گرداننده می‌ماند."],
                ["timer", "بستن خودکار", "بازی‌های باز بعد از ۸ ساعت با نتیجه نامشخص بسته می‌شوند."],
              ].map(([icon, title, text]) => (
                <div key={title} className="flex gap-3 rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                  <span className="material-symbols-outlined text-xl text-[var(--pm-primary)]">{icon}</span>
                  <div>
                    <p className="text-sm font-black text-[var(--pm-text)]">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--pm-muted)]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
