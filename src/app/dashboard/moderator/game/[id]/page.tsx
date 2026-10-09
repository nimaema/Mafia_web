"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  deleteNightEvent,
  endGame,
  setGamePhase,
  type GamePhaseInput,
  getGameStatus,
  publishNightRecords,
  recordDayElimination,
  recordNightEvent,
  setPlayerAliveStatus,
  updateDayEventRecord,
  updateNightEventRecord,
} from "@/actions/game";
import {
  ArrowCounterClockwise,
  ArrowRight,
  CaretLeft,
  Check,
  DotsThreeOutline,
  Gavel,
  Knife,
  MoonStars,
  NotePencil,
  Pause,
  Play,
  Prohibit,
  ShieldCheck,
  Star,
  Sun,
  UserMinus,
  UserPlus,
} from "@phosphor-icons/react";
import { usePopup } from "@/components/PopupProvider";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
import { Sheet } from "@/components/ui/Sheet";
import { FactionTag } from "@/components/ui/Tag";
import { assignTableHues } from "@/lib/playerColor";
import { PHASE_SURFACE, logbookDayLabel, logbookNightLabel, phaseTitle, type Phase } from "@/lib/phase";
import { GameReportTimeline, type GameReportEvent } from "@/components/game/GameReportTimeline";
import { PhaseControl } from "@/components/game/PhaseControl";

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
  userId?: string | null;
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

function SpeechTimer({ title, defaultSeconds }: { title: string; defaultSeconds: number }) {
  const [duration, setDuration] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const alarmedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const progress = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;
  const urgent = running && remaining <= 10;

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
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-extrabold">{title}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => updateDuration(duration - 15)} className="nq-icon-btn size-8 rounded-[0.6rem] text-xs font-black" aria-label="۱۵ ثانیه کمتر">
            −
          </button>
          <span className="w-10 text-center text-xs font-bold text-muted tabular-nums">{`${duration.toLocaleString("fa-IR")}ث`}</span>
          <button type="button" onClick={() => updateDuration(duration + 15)} className="nq-icon-btn size-8 rounded-[0.6rem] text-xs font-black" aria-label="۱۵ ثانیه بیشتر">
            +
          </button>
        </div>
      </div>
      <p className={`text-center text-5xl font-black tabular-nums transition-colors ${urgent ? "text-danger" : remaining === 0 ? "text-muted" : "text-fg"}`} dir="ltr" aria-live="off">
        {formatTimer(remaining)}
      </p>
      <span className="block h-1.5 overflow-hidden rounded-full bg-raised" aria-hidden>
        <span className={`block h-full rounded-full transition-[width] duration-1000 ease-linear ${urgent ? "bg-danger" : "bg-accent"}`} style={{ width: `${progress * 100}%` }} />
      </span>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button type="button" onClick={toggleRunning} className="nq-btn nq-btn-primary">
          {running ? <Pause size={18} weight="fill" aria-hidden /> : <Play size={18} weight="fill" aria-hidden />}
          {running ? "مکث" : remaining > 0 && remaining < duration ? "ادامه" : "شروع"}
        </button>
        <button type="button" onClick={reset} className="nq-icon-btn size-12" aria-label="از نو">
          <ArrowCounterClockwise size={20} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  const players: PlayerRecord[] = useMemo(() => game?.players || [], [game]);
  const hues = useMemo(() => assignTableHues(players.map((player) => player.userId || player.id)), [players]);
  const serverPhase: Phase | null = game?.phase || null;
  const serverPhaseNumber: number = game?.phaseNumber ?? 0;

  // The server phase drives every player's phone. Keep the logbook's day/night numbering in step:
  // logbook "day r" comes before "night r", so server DAY n (after night n) is logbook day n + 1.
  useEffect(() => {
    if (!serverPhase) return;
    if (serverPhase === "NIGHT") {
      setReportMode("NIGHT");
      setNightNumber(Math.max(1, serverPhaseNumber));
    } else {
      setReportMode("DAY");
      setDayNumber(serverPhaseNumber + 1);
      setNightNumber(Math.max(1, serverPhaseNumber));
    }
  }, [serverPhase, serverPhaseNumber]);

  const goToPhase = async (next: GamePhaseInput) => {
    const result = await setGamePhase(gameId, next);
    if (result.error) {
      showAlert("تغییر مرحله انجام نشد", result.error, "error");
      return false;
    }
    await refreshGame();
    return true;
  };
  const mafiaConversionRoles: { id: string; name: string }[] = useMemo(() => game?.mafiaConversionRoles || [], [game]);
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
  const nightEvents: NightEventRecord[] = useMemo(() => game?.nightEvents || [], [game]);
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

  const mafiaShotAction = actionOptions.find((option) => option.key === "side:mafia-shot");
  const roleActionOptions = actionOptions.filter((option) => option.source === "role");
  const activePhaseLabel = reportMode === "DAY" ? logbookDayLabel(dayNumber) : logbookNightLabel(nightNumber);
  const chooserPhaseLabel = reportMode === "DAY" ? logbookDayLabel(dayNumber) : logbookNightLabel(nightNumber);

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

  const startVote = async () => {
    if (game?.status === "IN_PROGRESS" && serverPhase !== "VOTE") {
      setBusy(true);
      const moved = await goToPhase("VOTE");
      setBusy(false);
      if (!moved) return;
    }
    openDayRecord("vote");
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

  const advanceToNextDay = async (nextRound: number) => {
    setReportChooserOpen(false);
    setReportModalOpen(false);
    setPlayerPicker(null);
    setShotResolution(null);
    if (game?.status === "IN_PROGRESS" && !(await goToPhase("DAY"))) return;
    setReportMode("DAY");
    setDayNumber((current) => Math.max(current, nextRound));
    setNightNumber(nextRound);
  };

  const finishCurrentPhase = async () => {
    setReportChooserOpen(false);
    if (reportMode === "DAY") {
      setReportModalOpen(false);
      setPlayerPicker(null);
      if (game?.status === "IN_PROGRESS") {
        setBusy(true);
        const moved = await goToPhase("NIGHT");
        setBusy(false);
        if (!moved) return;
      }
      setReportMode("NIGHT");
      setNightNumber((current) => Math.max(current, dayNumber));
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

    await advanceToNextDay(nextRound);
  };

  const resolveMafiaShot = async (isDead: boolean) => {
    if (!shotResolution) return;
    if (!isDead) {
      await advanceToNextDay(shotResolution.nextRound);
      showToast(`${shotResolution.player.name} زنده ماند`, "info");
      return;
    }

    setBusy(true);
    const result = await setPlayerAliveStatus(gameId, shotResolution.player.id, false);
    if (result.success) {
      showToast(`${shotResolution.player.name} با شلیک شب حذف شد`, "success");
      await refreshGame();
      await advanceToNextDay(shotResolution.nextRound);
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
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold">{label}</span>
          {!required && value ? (
            <button type="button" onClick={() => clearPlayerSlot(slot, index)} className="text-xs font-bold text-muted hover:text-danger">
              پاک کردن
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => openPlayerPicker({ slot, title: label, options, index })}
          disabled={disabled}
          className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-sunken px-3 text-right transition-colors hover:border-accent/50 disabled:opacity-50"
        >
          {selectedPlayer ? (
            <MaskAvatar seed={selectedPlayer.userId || selectedPlayer.id} hue={hues.get(selectedPlayer.userId || selectedPlayer.id)} size="sm" eliminated={selectedPlayer.isAlive === false} />
          ) : (
            <span className="grid size-9 place-items-center rounded-[0.7rem] border-2 border-dashed border-line-strong text-muted">
              <UserPlus size={16} weight="bold" aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{selectedPlayer?.name || "انتخاب بازیکن"}</span>
            {selectedPlayer?.role?.name ? <span className="block truncate text-xs font-medium text-muted">{selectedPlayer.role.name}</span> : null}
          </span>
          <CaretLeft size={18} weight="bold" className="shrink-0 text-muted" aria-hidden />
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
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="-mx-4 -mt-5 h-48 animate-pulse bg-night md:mx-0 md:mt-0 md:rounded-[var(--radius-lg)]" />
        <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
      </div>
    );
  }

  const finished = game?.status === "FINISHED";
  const surface = finished ? "bg-surface text-fg" : serverPhase ? PHASE_SURFACE[serverPhase] : reportMode === "NIGHT" ? PHASE_SURFACE.NIGHT : PHASE_SURFACE.DAY;
  const headerTitle = finished ? "بازی تمام شد" : serverPhase ? phaseTitle(serverPhase, serverPhaseNumber) : activePhaseLabel;
  const nightPhase = reportMode === "NIGHT";
  const toFa = (value: number) => value.toLocaleString("fa-IR");

  const WINNERS = [
    { key: "CITIZEN" as const, label: "شهروندان بردند", Icon: ShieldCheck, className: "bg-citizen/14 text-citizen" },
    { key: "MAFIA" as const, label: "مافیا برد", Icon: Knife, className: "bg-mafia/14 text-mafia" },
    { key: "NEUTRAL" as const, label: "مستقل‌ها بردند", Icon: Star, className: "bg-independent/16 text-independent" },
    { key: "UNKNOWN" as const, label: "نتیجه نامعلوم", Icon: Prohibit, className: "bg-raised text-muted" },
  ];

  const actorButton = (option: NightActionOption, player: PlayerRecord) => (
    <button
      key={`${option.key}-${player.id}`}
      type="button"
      onClick={() => openNightAction(option, player, true)}
      disabled={busy || player.isAlive === false}
      className="flex min-h-12 items-center gap-2.5 rounded-[var(--radius-sm)] bg-raised px-2.5 text-right transition-colors hover:bg-line disabled:opacity-45"
    >
      <MaskAvatar seed={player.userId || player.id} hue={hues.get(player.userId || player.id)} size="xs" eliminated={player.isAlive === false} />
      <span className="min-w-0 flex-1 truncate text-sm font-bold">{player.name}</span>
      <CaretLeft size={14} weight="bold" className="text-muted" aria-hidden />
    </button>
  );

  return (
    <div className="flex flex-col gap-8 pb-40 md:pb-12">
      {/* Phase header: the same color the players' phones show */}
      <header className={`nq-grain relative -mx-4 -mt-5 overflow-hidden px-4 pb-7 pt-4 transition-colors duration-700 md:mx-0 md:mt-0 md:rounded-[var(--radius-lg)] md:px-6 ${surface}`}>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link href="/dashboard/moderator" className="nq-icon-btn bg-black/15 text-current hover:text-current" aria-label="بازگشت به لابی‌ها">
            <ArrowRight size={20} weight="bold" aria-hidden />
          </Link>
          <button type="button" onClick={() => setMenuOpen(true)} className="nq-icon-btn bg-black/15 text-current hover:text-current" aria-label="گزینه‌های بازی">
            <DotsThreeOutline size={20} weight="fill" aria-hidden />
          </button>
        </div>
        <p className="relative z-10 mt-5 text-sm font-bold opacity-80">{`${game?.name || "بازی"} · ${game?.scenario?.name || "سناریو"}`}</p>
        <h1 className="nq-display relative z-10 mt-1 text-[3.2rem] leading-[1.05] lg:text-[4rem]">{headerTitle}</h1>
        <p className="relative z-10 mt-2 text-sm font-bold opacity-85">{`${toFa(alivePlayers.length)} از ${toFa(players.length)} نفر در بازی`}</p>
      </header>

      {finished ? (
        <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
          <p className="font-extrabold">{({ CITIZEN: "شهروندان بردند", MAFIA: "مافیا برد", NEUTRAL: "مستقل‌ها بردند" } as Record<string, string>)[game?.winningAlignment || ""] || "نتیجه نامعلوم ثبت شد"}</p>
          {nightEvents.length > 0 ? (
            <button type="button" onClick={handlePublishNightRecords} disabled={busy || game?.nightRecordsPublic} className={`nq-btn ${game?.nightRecordsPublic ? "nq-btn-secondary" : "nq-btn-primary"}`}>
              {game?.nightRecordsPublic ? "گزارش برای بازیکنان منتشر شده" : "انتشار گزارش برای بازیکنان"}
            </button>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
        <div className="flex flex-col gap-8">
          {/* What now: tonight's actions or today's decisions */}
          {!finished ? (
            nightPhase ? (
              <section aria-labelledby="tonight-title" className="flex flex-col gap-4">
                <h2 id="tonight-title" className="flex items-center gap-2 text-lg font-extrabold">
                  <MoonStars size={20} weight="fill" className="text-accent" aria-hidden />
                  {`دفترچه ${logbookNightLabel(nightNumber)}`}
                </h2>
                {mafiaShotAction ? (
                  <div className="rounded-[var(--radius-lg)] border border-mafia/35 bg-mafia/8 p-4">
                    <p className="font-extrabold text-mafia">تصمیم مافیا</p>
                    <p className="mt-0.5 text-sm font-medium text-muted">اگر یاکوزا، خریداری یا ناتو استفاده شد، «بدون شلیک» را بزنید.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => openNightAction(mafiaShotAction, null, true)} disabled={busy} className="nq-btn bg-mafia text-white hover:brightness-110">
                        <Knife size={18} weight="fill" aria-hidden />
                        شلیک
                      </button>
                      <button type="button" onClick={() => openNightAction(mafiaShotAction, null, false)} disabled={busy} className="nq-btn nq-btn-secondary">
                        بدون شلیک
                      </button>
                    </div>
                  </div>
                ) : null}
                {roleActionOptions.length === 0 ? (
                  <p className="rounded-[var(--radius-lg)] border border-dashed border-line-strong p-5 text-sm font-medium text-muted">برای نقش‌های این بازی توانایی شبی روشن نیست.</p>
                ) : (
                  roleActionOptions.map((option) => (
                    <div key={option.key} className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-extrabold">{option.label}</p>
                          <p className="mt-0.5 text-xs font-medium text-muted">{`${option.sourceLabel} · ${abilityCompactLabel(option)}`}</p>
                        </div>
                        <FactionTag alignment={option.candidates[0]?.role?.alignment} />
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">{option.candidates.map((player) => actorButton(option, player))}</div>
                    </div>
                  ))
                )}
              </section>
            ) : (
              <section aria-labelledby="today-title" className="flex flex-col gap-4">
                <h2 id="today-title" className="flex items-center gap-2 text-lg font-extrabold">
                  <Sun size={20} weight="fill" className="text-warning" aria-hidden />
                  {logbookDayLabel(dayNumber)}
                </h2>
                <button type="button" onClick={startVote} disabled={busy} className="nq-btn nq-btn-lg bg-verdict text-verdict-ink hover:brightness-110">
                  <Gavel size={20} weight="fill" aria-hidden />
                  {serverPhase === "VOTE" ? "ثبت دفاع و نتیجه رأی" : "شروع رأی‌گیری"}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {DAY_ELIMINATION_METHODS.filter((method) => method.key !== "vote").map((method) => (
                    <button key={method.key} type="button" onClick={() => openDayRecord(method.key)} disabled={busy} className="nq-btn nq-btn-secondary nq-btn-sm min-h-12">
                      {method.label}
                    </button>
                  ))}
                </div>
              </section>
            )
          ) : null}

          {/* The table: moderator sees every role */}
          <section aria-labelledby="table-title">
            <div className="flex items-baseline justify-between">
              <h2 id="table-title" className="text-lg font-extrabold">
                دور میز
              </h2>
              <span className="text-sm font-bold text-muted">{`${toFa(eliminatedPlayers.length)} نفر بیرون`}</span>
            </div>
            <ul className="mt-3 divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-surface px-4">
              {displayPlayers.map((player) => {
                const out = player.isAlive === false;
                return (
                  <li key={player.id} className="flex items-center gap-3 py-2.5">
                    <MaskAvatar seed={player.userId || player.id} hue={hues.get(player.userId || player.id)} size="md" eliminated={out} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-bold ${out ? "text-muted line-through" : ""}`}>{player.name}</span>
                      <span className="block truncate text-sm font-medium text-muted">{player.role?.name || "بدون نقش"}</span>
                    </span>
                    <FactionTag alignment={player.role?.alignment} />
                    {!finished ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePlayer(player)}
                        disabled={busy}
                        className={`nq-icon-btn size-10 ${out ? "text-success" : "hover:!text-danger"}`}
                        aria-label={out ? `بازگرداندن ${player.name}` : `بیرون کردن ${player.name}`}
                        title={out ? "بازگرداندن" : "بیرون کردن"}
                      >
                        {out ? <UserPlus size={18} weight="bold" aria-hidden /> : <UserMinus size={18} weight="bold" aria-hidden />}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-8">
          {!finished ? (
            <section aria-label="زمان صحبت" className="grid grid-cols-2 gap-3">
              <SpeechTimer title="نوبت" defaultSeconds={60} />
              <SpeechTimer title="چالش" defaultSeconds={30} />
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            {!finished ? (
              <button type="button" onClick={() => openReportChooser(reportMode)} disabled={busy} className="nq-btn nq-btn-secondary self-start">
                <NotePencil size={18} weight="bold" aria-hidden />
                ثبت اتفاق دیگر
              </button>
            ) : null}
            <GameReportTimeline
              events={nightEvents}
              title="داستان بازی"
              subtitle="هر چه ثبت می‌کنید اینجا می‌آید. بعد از بازی می‌توانید آن را برای بازیکنان منتشر کنید."
              isPublic={game?.nightRecordsPublic}
              busy={busy}
              onEdit={finished ? undefined : (event: GameReportEvent) => openEditReportEvent(event as NightEventRecord)}
              onDelete={finished ? undefined : (event: GameReportEvent) => handleDeleteNightEvent(event as NightEventRecord)}
            />
          </section>
        </div>
      </div>

      {/* Next phase: pinned above the tab bar on phones */}
      {!finished ? (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-xl md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto max-w-6xl">
            <button type="button" onClick={finishCurrentPhase} disabled={busy} className={`nq-btn nq-btn-lg w-full md:w-auto md:min-w-64 ${nightPhase ? "bg-day text-day-ink" : "bg-night text-moon"} hover:brightness-110`}>
              {nightPhase ? <Sun size={20} weight="fill" aria-hidden /> : <MoonStars size={20} weight="fill" aria-hidden />}
              {nightPhase ? `صبح شود (${logbookDayLabel(nightNumber + 1)})` : `شب شود (${logbookNightLabel(dayNumber)})`}
            </button>
          </div>
        </div>
      ) : null}

      {/* Game menu */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="گزینه‌های بازی">
        <div className="flex flex-col gap-6">
          {!finished ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold">جابه‌جایی دستی مرحله</p>
              <p className="text-sm font-medium text-muted">اگر مرحله اشتباه رفت، از اینجا درستش کنید. گوشی همه بازیکنان هم عوض می‌شود.</p>
              <PhaseControl gameId={gameId} phase={serverPhase} phaseNumber={serverPhaseNumber} onChanged={() => refreshGame()} onError={(message) => showAlert("تغییر مرحله انجام نشد", message, "error")} />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold">{finished ? "نتیجه ثبت شده" : "پایان بازی"}</p>
            {!finished ? <p className="text-sm font-medium text-muted">بازی‌های باز بعد از ۸ ساعت خودکار با نتیجه نامعلوم بسته می‌شوند.</p> : null}
            <div className="grid grid-cols-2 gap-2">
              {WINNERS.map(({ key, label, Icon, className }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleEndGame(key);
                  }}
                  disabled={busy || finished}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-extrabold disabled:opacity-50 ${className}`}
                >
                  <Icon size={18} weight="fill" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      {/* Quick chooser */}
      <Sheet open={reportChooserOpen} onClose={() => setReportChooserOpen(false)} title={`ثبت اتفاق برای ${chooserPhaseLabel}`} size="lg">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-raised p-1">
            {[
              { mode: "DAY" as const, label: logbookDayLabel(dayNumber) },
              { mode: "NIGHT" as const, label: logbookNightLabel(nightNumber) },
            ].map((item) => (
              <button key={item.mode} type="button" onClick={() => setReportMode(item.mode)} aria-pressed={reportMode === item.mode} className={`min-h-11 rounded-[0.75rem] text-sm font-extrabold ${reportMode === item.mode ? "bg-accent-soft text-accent" : "text-muted"}`}>
                {item.label}
              </button>
            ))}
          </div>
          {reportMode === "DAY" ? (
            <div className="grid grid-cols-2 gap-2">
              {DAY_ELIMINATION_METHODS.map((method) => (
                <button key={method.key} type="button" onClick={() => openDayRecord(method.key)} disabled={busy} className="nq-btn nq-btn-secondary min-h-14">
                  {method.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {mafiaShotAction ? (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => openNightAction(mafiaShotAction, null, true)} disabled={busy} className="nq-btn bg-mafia text-white">
                    شلیک مافیا
                  </button>
                  <button type="button" onClick={() => openNightAction(mafiaShotAction, null, false)} disabled={busy} className="nq-btn nq-btn-secondary">
                    بدون شلیک
                  </button>
                </div>
              ) : null}
              {roleActionOptions.map((option) => (
                <div key={`chooser-${option.key}`}>
                  <p className="text-sm font-extrabold">{`${option.label} · ${option.sourceLabel}`}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">{option.candidates.map((player) => actorButton(option, player))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Sheet>

      {/* Record a night action or a day event */}
      <Sheet
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setEditingEventId(null);
          setPlayerPicker(null);
        }}
        title={
          reportMode === "NIGHT"
            ? `${editingEventId ? "ویرایش" : "ثبت"} ${selectedAction?.label || "اتفاق شب"}`
            : `${editingEventId ? "ویرایش" : "ثبت"} ${dayMethodKey === "vote" ? "رأی‌گیری" : DAY_ELIMINATION_METHODS.find((method) => method.key === dayMethodKey)?.label || "اتفاق روز"}`
        }
        eyebrow={<p className="text-sm font-bold text-muted">{reportMode === "NIGHT" ? logbookNightLabel(nightNumber) : logbookDayLabel(dayNumber)}</p>}
        footer={
          reportMode === "NIGHT" ? (
            <button type="button" onClick={handleRecordNightEvent} disabled={busy} className="nq-btn nq-btn-primary nq-btn-lg w-full">
              {editingEventId ? "ذخیره تغییرات" : `ثبت در ${logbookNightLabel(nightNumber)}`}
            </button>
          ) : (
            <button type="button" onClick={handleRecordDayElimination} disabled={busy} className="nq-btn nq-btn-lg w-full bg-verdict text-verdict-ink">
              {editingEventId ? "ذخیره تغییرات" : dayTargetPlayerId ? `ثبت حذف (${logbookDayLabel(dayNumber)})` : `ثبت دفاع‌ها (${logbookDayLabel(dayNumber)})`}
            </button>
          )
        }
      >
        {reportMode === "NIGHT" ? (
          <div className="flex flex-col gap-5">
            {selectedAction?.source === "role" && actorPlayerId ? (
              <p className="rounded-[var(--radius-sm)] bg-raised px-4 py-3 text-sm font-bold">{`انجام‌دهنده: ${playerById(actorPlayerId)?.name || "بازیکن"} (${playerById(actorPlayerId)?.role?.name || selectedAction.sourceLabel})`}</p>
            ) : null}

            {selectedAction?.source === "side" ? (
              <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-raised p-1">
                {[
                  { value: true, label: "شلیک کرد" },
                  { value: false, label: "شلیک نکرد" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    aria-pressed={eventWasUsed === item.value}
                    onClick={() => {
                      setEventWasUsed(item.value);
                      if (!item.value) resetNightTargets();
                    }}
                    className={`min-h-11 rounded-[0.75rem] text-sm font-extrabold ${eventWasUsed === item.value ? "bg-mafia/16 text-mafia" : "text-muted"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {selectedAction && selectedAction.choices.length > 0 && !usesTargetSlotChoices ? (
              <fieldset>
                <legend className="mb-2 text-sm font-bold">کدام حالت؟</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedAction.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      aria-pressed={selectedChoiceKey === choice.id}
                      onClick={() => setSelectedChoiceKey(choice.id)}
                      className={`rounded-[var(--radius-sm)] px-3 py-2.5 text-right ${selectedChoiceKey === choice.id ? "bg-accent-soft text-accent ring-1 ring-accent/45" : "bg-raised"}`}
                    >
                      <span className="block text-sm font-extrabold">{choice.label}</span>
                      <span className="mt-0.5 block text-xs font-medium opacity-75">{`${usageLabel(choice.usesPerGame)} · ${effectLabel(choice.effectType)}`}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {fixedEffectType !== "NONE" ? <p className="nq-tag self-start bg-accent-soft text-accent">{`نوع ثبت: ${effectLabel(fixedEffectType)}`}</p> : null}

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

            {showsSecondaryTarget
              ? renderPlayerButton({
                  label: selectedEffectType === "YAKUZA" ? "مافیای قربانی یاکوزا" : usesTargetSlotChoices ? selectedAction.choices[1]?.label || "گزینه ۲" : selectedEffectType === "TWO_NAME_INQUIRY" ? "اسم دوم" : "هدف دوم (اختیاری)",
                  value: secondaryTargetPlayerId,
                  slot: "secondary",
                  options: secondaryTargetOptions,
                  disabled: !eventWasUsed,
                  required: needsSecondaryTarget,
                })
              : null}

            {Array.from({ length: extraTargetSlots }).map((_, index) => (
              <div key={`extra-target-${index}`}>
                {renderPlayerButton({
                  label: usesTargetSlotChoices ? selectedAction.choices[index + 2]?.label || `گزینه ${toFa(index + 3)}` : `هدف ${toFa(index + 3)} (اختیاری)`,
                  value: extraTargetPlayerIds[index] || "",
                  slot: "extra",
                  options: players,
                  index,
                  disabled: !eventWasUsed,
                })}
              </div>
            ))}

            {needsConversionRole ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold">نقش مافیایی بعد از خریداری</span>
                <select value={convertedRoleId} onChange={(event) => setConvertedRoleId(event.target.value)} disabled={!eventWasUsed}>
                  <option value="">یک نقش مافیا انتخاب کنید</option>
                  {mafiaConversionRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">یادداشت (اختیاری)</span>
              <textarea value={nightNote} onChange={(event) => setNightNote(event.target.value.slice(0, 500))} className="min-h-24 resize-y rounded-[var(--radius-sm)] border border-line bg-sunken p-3 font-medium" />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-raised p-1">
              {DAY_ELIMINATION_METHODS.map((method) => (
                <button
                  key={method.key}
                  type="button"
                  aria-pressed={dayMethodKey === method.key}
                  onClick={() => {
                    setDayMethodKey(method.key);
                    if (method.key !== "vote") setDayDefensePlayerIds([]);
                  }}
                  className={`min-h-11 rounded-[0.75rem] text-sm font-extrabold ${dayMethodKey === method.key ? "bg-verdict/18 text-verdict-ink dark:text-[oklch(0.85_0.1_22)]" : "text-muted"}`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {dayMethodKey === "custom" ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold">نام این روش</span>
                <input value={customDayMethod} onChange={(event) => setCustomDayMethod(event.target.value.slice(0, 80))} placeholder="مثلاً حکم قاضی" />
              </label>
            ) : null}

            {dayMethodKey === "vote" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold">چه کسانی به دفاع رفتند؟</span>
                  <button type="button" onClick={() => openPlayerPicker({ slot: "defense", title: "بازیکنان دفاع", options: alivePlayers, multi: true })} className="text-sm font-bold text-accent">
                    انتخاب
                  </button>
                </div>
                {selectedDefensePlayers.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedDefensePlayers.map((player) => (
                      <button key={`defense-${player.id}`} type="button" onClick={() => setDayDefensePlayerIds((current) => current.filter((id) => id !== player.id))} className="flex items-center gap-2 rounded-full bg-raised py-1 pe-3 ps-1 text-sm font-bold" aria-label={`برداشتن ${player.name}`}>
                        <MaskAvatar seed={player.userId || player.id} hue={hues.get(player.userId || player.id)} size="xs" />
                        {player.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-[var(--radius-sm)] border border-dashed border-line-strong px-3 py-2.5 text-sm font-medium text-muted">هنوز کسی انتخاب نشده.</p>
                )}
              </div>
            ) : null}

            {renderPlayerButton({
              label: dayMethodKey === "vote" ? "چه کسی بیرون رفت؟ (اختیاری)" : "چه کسی بیرون رفت؟",
              value: dayTargetPlayerId,
              slot: "day",
              options: alivePlayers,
              disabled: busy,
              required: dayMethodKey !== "vote",
            })}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">یادداشت (اختیاری)</span>
              <textarea value={dayNote} onChange={(event) => setDayNote(event.target.value.slice(0, 500))} className="min-h-20 resize-y rounded-[var(--radius-sm)] border border-line bg-sunken p-3 font-medium" />
            </label>
          </div>
        )}
      </Sheet>

      {/* Dawn: did the mafia shot land? */}
      <Sheet open={Boolean(shotResolution)} onClose={() => setShotResolution(null)} title="نتیجه شلیک مافیا">
        {shotResolution ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <MaskAvatar seed={shotResolution.player.userId || shotResolution.player.id} hue={hues.get(shotResolution.player.userId || shotResolution.player.id)} size="xl" />
            <p className="font-medium leading-7 text-muted">
              <b className="font-extrabold text-fg">{shotResolution.player.name}</b>
              {` هدف شلیک مافیا در ${logbookNightLabel(nightNumber)} بود. بعد از نجات دکتر و اثر نقش‌ها، از بازی بیرون رفت؟`}
            </p>
            <div className="grid w-full grid-cols-2 gap-2">
              <button type="button" onClick={() => resolveMafiaShot(true)} disabled={busy} className="nq-btn nq-btn-lg bg-mafia text-white">
                بیرون رفت
              </button>
              <button type="button" onClick={() => resolveMafiaShot(false)} disabled={busy} className="nq-btn nq-btn-secondary nq-btn-lg">
                زنده ماند
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      {/* Player picker */}
      <Sheet
        open={Boolean(playerPicker)}
        onClose={() => setPlayerPicker(null)}
        title={playerPicker?.title || "انتخاب بازیکن"}
        footer={
          playerPicker?.multi ? (
            <button type="button" onClick={() => setPlayerPicker(null)} className="nq-btn nq-btn-primary nq-btn-lg w-full">
              {`تایید (${toFa(dayDefensePlayerIds.length)} نفر)`}
            </button>
          ) : undefined
        }
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {(playerPicker?.options || []).map((player) => {
            const selected = playerPicker?.slot === "defense" && dayDefensePlayerIds.includes(player.id);
            const out = player.isAlive === false;
            return (
              <li key={`${playerPicker?.slot}-${playerPicker?.index ?? "main"}-${player.id}`}>
                <button
                  type="button"
                  onClick={() => pickPlayer(player.id)}
                  aria-pressed={playerPicker?.multi ? selected : undefined}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-right ${selected ? "bg-accent-soft ring-1 ring-accent/50" : "bg-raised hover:bg-line"}`}
                >
                  <MaskAvatar seed={player.userId || player.id} hue={hues.get(player.userId || player.id)} size="sm" eliminated={out} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-bold ${out ? "text-muted line-through" : ""}`}>{player.name}</span>
                    <span className="block truncate text-xs font-medium text-muted">{player.role?.name || "بدون نقش"}</span>
                  </span>
                  {selected ? <Check size={18} weight="bold" className="text-accent" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
