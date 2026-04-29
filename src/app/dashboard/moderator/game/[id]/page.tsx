"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteNightEvent,
  endGame,
  getGameStatus,
  publishNightRecords,
  recordDayElimination,
  recordNightEvent,
  setPlayerAliveStatus,
} from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";

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
  return "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400";
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
  return usesPerGame ? `${usesPerGame} بار` : "نامحدود";
}

function abilityLimitLabel(option: NightActionOption) {
  const parts = [`کل: ${usageLabel(option.usesPerGame)}`];
  if (option.usesPerNight) parts.push(`هر شب: ${option.usesPerNight}`);
  parts.push(`${option.targetsPerUse || 1} هدف`);
  if (option.selfTargetLimit !== null) parts.push(`روی خود: ${option.selfTargetLimit}`);
  if (option.effectType !== "NONE") parts.push(effectLabel(option.effectType));
  if (option.choices.length) parts.push(`${option.choices.length} انتخاب`);
  return parts.join("، ");
}

const DAY_ELIMINATION_METHODS = [
  { key: "vote", label: "رای‌گیری", icon: "how_to_vote" },
  { key: "gun", label: "شلیک روز", icon: "target" },
  { key: "bazporsi", label: "بازپرسی", icon: "find_in_page" },
  { key: "custom", label: "روش سناریو", icon: "edit_note" },
];

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

function isDayEvent(event: NightEventRecord) {
  return event.details?.phase === "DAY" || event.abilityKey.startsWith("day:");
}

function reportEventTitle(event: NightEventRecord) {
  if (isDayEvent(event)) return event.details?.methodLabel || event.abilityLabel.replace(/^حذف روز:\s*/, "") || "حذف روز";
  return `${event.abilityLabel}${event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}`;
}

function reportActorTargetLine(event: NightEventRecord) {
  const actor = event.actorPlayer?.name || event.abilitySource || alignmentLabel(event.actorAlignment);
  const target = event.targetPlayer?.name || "نامشخص";
  return event.wasUsed === false ? `${actor} ← بدون هدف` : `${actor} ← ${target}`;
}

function ReportEventRow({
  event,
  busy,
  onDelete,
}: {
  event: NightEventRecord;
  busy: boolean;
  onDelete: (event: NightEventRecord) => void;
}) {
  const dayEvent = isDayEvent(event);
  const tone = dayEvent
    ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    : event.wasUsed === false
      ? "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-300"
      : "border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300";

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-black ${tone}`}>
              <span className="material-symbols-outlined text-sm">{dayEvent ? "wb_sunny" : "dark_mode"}</span>
              {dayEvent ? "روز" : event.wasUsed === false ? "استفاده نشد" : "شب"}
            </span>
            <p className="text-sm font-black text-zinc-950 dark:text-white">{reportEventTitle(event)}</p>
            {event.details?.effectType && event.details.effectType !== "NONE" && (
              <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-black text-sky-700 dark:text-sky-300">
                {effectLabel(event.details.effectType)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{reportActorTargetLine(event)}</p>
          {Array.isArray(event.details?.targetLabels) && event.details.targetLabels.length > 0 && (
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              گزینه‌ها: {event.details.targetLabels.map((target) => `${target.label}: ${target.playerName || "نامشخص"}`).join("، ")}
            </p>
          )}
          {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && event.details?.secondaryTargetName && (
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {event.details.effectType === "YAKUZA" ? "قربانی یاکوزا" : "هدف دوم"}: {event.details.secondaryTargetName}
            </p>
          )}
          {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && Array.isArray(event.details?.extraTargets) && event.details.extraTargets.length > 0 && (
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              هدف‌های اضافه: {event.details.extraTargets.map((target) => target.name).join("، ")}
            </p>
          )}
          {event.details?.convertedRoleName && (
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              تبدیل نقش: {event.details.previousRoleName || "نقش قبلی"} ← {event.details.convertedRoleName}
            </p>
          )}
          {event.note && (
            <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs leading-5 text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
              {event.note}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(event)}
          disabled={busy}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white"
          aria-label="حذف رکورد"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </article>
  );
}

export default function ModeratorGamePage() {
  const params = useParams();
  const router = useRouter();
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
  const [dayMethodKey, setDayMethodKey] = useState("vote");
  const [customDayMethod, setCustomDayMethod] = useState("");
  const [dayNote, setDayNote] = useState("");

  const refreshGame = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const result = await getGameStatus(gameId);
    if (!result) {
      router.push("/dashboard/moderator");
      return;
    }
    setGame(result);
    const latestNight = Math.max(1, ...(result.nightEvents || []).map((event: NightEventRecord) => event.nightNumber));
    setNightNumber((current) => Math.max(current, latestNight));
    setDayNumber((current) => Math.max(current, latestNight));
    setLoading(false);
  };

  useEffect(() => {
    refreshGame(true);
  }, [gameId]);

  const players: PlayerRecord[] = game?.players || [];
  const mafiaConversionRoles: { id: string; name: string }[] = game?.mafiaConversionRoles || [];
  const alivePlayers = players.filter((player) => player.isAlive !== false);
  const eliminatedPlayers = players.filter((player) => player.isAlive === false);
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
          effectType: normalizeEffectType(ability.effectType),
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
  const canChooseReportEffect = selectedAction?.source === "role" && fixedEffectType === "NONE";
  const selectedEffectType = fixedEffectType !== "NONE" ? fixedEffectType : canChooseReportEffect ? reportEffectType : "NONE";
  const selectedTargetCount = Math.max(
    selectedEffectType === "TWO_NAME_INQUIRY" ? 2 : 1,
    selectedAction?.targetsPerUse || 1
  );
  const needsConversionRole = selectedEffectType === "CONVERT_TO_MAFIA" || selectedEffectType === "YAKUZA";
  const needsSecondaryTarget = selectedEffectType === "YAKUZA" || selectedEffectType === "TWO_NAME_INQUIRY" || selectedTargetCount > 1;
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
    if (eventWasUsed && extraTargetSlots > 0 && extraTargetPlayerIds.slice(0, extraTargetSlots).filter(Boolean).length < extraTargetSlots) {
      showAlert("هدف‌های اضافه", "همه هدف‌های لازم برای این توانایی را انتخاب کنید.", "warning");
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
    if (eventWasUsed && selectedAction.usesPerGame && actorPlayerId) {
      const usedByActor = nightEvents.filter(
        (event) => event.wasUsed !== false && event.abilityKey === selectedAction.key && event.actorPlayer?.id === actorPlayerId
      ).length;
      if (usedByActor >= selectedAction.usesPerGame) {
        showAlert("سقف توانایی", `این توانایی برای این بازیکن قبلاً ${selectedAction.usesPerGame} بار ثبت شده است.`, "warning");
        return;
      }
    }
    if (eventWasUsed && selectedAction.usesPerNight && actorPlayerId) {
      const usedThisNight = nightEvents.filter(
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
      const usedChoice = nightEvents.filter(
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
      const selfUses = nightEvents.filter(
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
    const result = await recordNightEvent(gameId, {
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
    });

    if (result.success) {
      showToast("رکورد شب ثبت شد", "success");
      setTargetPlayerId("");
      setSecondaryTargetPlayerId("");
      setExtraTargetPlayerIds([]);
      setNightNote("");
      setEventWasUsed(true);
      await refreshGame();
    } else {
      showAlert("خطا", result.error || "ثبت اتفاق شب انجام نشد", "error");
    }
    setBusy(false);
  };

  const handleRecordDayElimination = async () => {
    if (!dayTargetPlayerId) {
      showAlert("حذف روز", "بازیکن حذف‌شده در روز را انتخاب کنید.", "warning");
      return;
    }

    const preset = DAY_ELIMINATION_METHODS.find((method) => method.key === dayMethodKey);
    const methodLabel = dayMethodKey === "custom" ? customDayMethod.trim() : preset?.label || "حذف روز";
    if (!methodLabel) {
      showAlert("روش حذف", "برای روش سناریویی یک عنوان کوتاه وارد کنید.", "warning");
      return;
    }

    setBusy(true);
    const result = await recordDayElimination(gameId, {
      dayNumber,
      targetPlayerId: dayTargetPlayerId,
      methodKey: dayMethodKey,
      methodLabel,
      note: dayNote,
    });

    if (result.success) {
      showToast("حذف روز در گزارش ثبت شد", "success");
      setDayTargetPlayerId("");
      setCustomDayMethod("");
      setDayNote("");
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
        <div className="ui-card flex w-full max-w-xl flex-col items-center gap-4 p-10 text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-lime-500 dark:border-zinc-800" />
          <p className="font-bold text-zinc-500 dark:text-zinc-400">در حال آماده‌سازی اتاق گرداننده...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-20" dir="rtl">
      <header className="ui-card overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03] xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="ui-icon-accent size-14">
              <span className="material-symbols-outlined text-3xl">shield_person</span>
            </div>
            <div className="min-w-0">
              <p className="ui-kicker">اتاق گرداننده</p>
              <h1 className="mt-1 truncate text-3xl font-black text-zinc-950 dark:text-white">{game?.name || "بازی مافیا"}</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                وضعیت بازیکنان، دفترچه اتفاقات شب و نتیجه نهایی بازی در یک صفحه کنترل می‌شود.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs font-black text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
              #{game?.code || gameId.slice(0, 6).toUpperCase()}
            </span>
            <span className={`rounded-lg border px-3 py-2 text-xs font-black ${game?.status === "FINISHED" ? "border-zinc-500/20 bg-zinc-500/10 text-zinc-500" : "border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300"}`}>
              {game?.status === "FINISHED" ? "پایان یافته" : "در جریان"}
            </span>
            <Link href="/dashboard/moderator" className="ui-button-secondary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">arrow_forward</span>
              بازگشت
            </Link>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["سناریو", game?.scenario?.name || "نامشخص", "account_tree", "text-lime-500"],
            ["بازیکنان فعال", `${alivePlayers.length} نفر`, "sensors", "text-emerald-500"],
            ["حذف‌شده‌ها", `${eliminatedPlayers.length} نفر`, "person_off", "text-red-500"],
            ["رکورد شب", `${nightEvents.length} مورد`, "dark_mode", "text-sky-500"],
          ].map(([label, value, icon, color]) => (
            <div key={label} className="ui-muted p-4">
              <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
              <p className="mt-3 truncate text-lg font-black text-zinc-950 dark:text-white">{value}</p>
              <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <section className="space-y-5">
          <div className="ui-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div>
                <p className="ui-kicker">وضعیت بازیکنان</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">بازیکنان و نقش‌ها</h2>
              </div>
              <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                {players.length} نفر
              </span>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
              {players.map((player, index) => {
                const alive = player.isAlive !== false;
                return (
                  <article
                    key={player.id}
                    className={`relative overflow-hidden rounded-lg border p-3 transition-all ${
                      alive
                        ? "border-zinc-200 bg-white hover:border-lime-500/30 dark:border-white/10 dark:bg-zinc-950/70"
                        : "border-red-500/20 bg-red-500/10 dark:border-red-400/20"
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 ${alive ? "bg-lime-500" : "bg-red-500"}`} />
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-black ${alive ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-red-500 text-white"}`}>
                          {getInitial(player.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-zinc-950 dark:text-white">{player.name}</p>
                          <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">بازیکن {index + 1}</p>
                        </div>
                      </div>
                      <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${alive ? "border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300" : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"}`}>
                        {alive ? "فعال" : "حذف‌شده"}
                      </span>
                    </div>

                    <div className={`mt-3 rounded-lg border p-3 ${alignmentClass(player.role?.alignment)}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black">{player.role?.name || "بدون نقش"}</p>
                        <span className="material-symbols-outlined text-lg">{alignmentIcon(player.role?.alignment)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 opacity-80">
                        {player.role?.description || "توضیحی ثبت نشده است."}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTogglePlayer(player)}
                      disabled={busy}
                      className={alive ? "ui-button-secondary mt-3 min-h-10 w-full text-red-600 dark:text-red-300" : "ui-button-secondary mt-3 min-h-10 w-full text-lime-700 dark:text-lime-300"}
                    >
                      <span className="material-symbols-outlined text-lg">{alive ? "person_off" : "person_add"}</span>
                      {alive ? "ثبت حذف" : "بازگرداندن"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="ui-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="ui-kicker">دفترچه شب</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">رکورد اتفاقات شب</h2>
              </div>
              {game?.status === "FINISHED" && nightEvents.length > 0 && (
                <button
                  onClick={handlePublishNightRecords}
                  disabled={busy || game?.nightRecordsPublic}
                  className={game?.nightRecordsPublic ? "ui-button-secondary min-h-10 px-3 text-xs text-lime-700 dark:text-lime-300" : "ui-button-primary min-h-10 px-3 text-xs"}
                >
                  <span className="material-symbols-outlined text-base">{game?.nightRecordsPublic ? "public" : "publish"}</span>
                  {game?.nightRecordsPublic ? "عمومی شده" : "عمومی کردن برای بازیکنان"}
                </button>
              )}
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-950 dark:text-white">ثبت اتفاق جدید</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">برای شب‌های طولانی هم فقط شماره شب را جلو ببرید.</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-950">
                    <button type="button" onClick={() => setNightNumber((value) => Math.max(1, value - 1))} className="flex size-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
                      <span className="material-symbols-outlined text-base">remove</span>
                    </button>
                    <span className="w-8 text-center text-sm font-black text-zinc-950 dark:text-white">{nightNumber}</span>
                    <button type="button" onClick={() => setNightNumber((value) => value + 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">نوع اتفاق</span>
                    <select value={selectedActionKey} onChange={(event) => { setSelectedActionKey(event.target.value); setActorPlayerId(""); setTargetPlayerId(""); setSecondaryTargetPlayerId(""); setExtraTargetPlayerIds([]); }}>
                      {actionOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label} - {option.sourceLabel} ({abilityLimitLabel(option)})
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedAction?.choices.length > 0 && !usesTargetSlotChoices && (
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">انتخاب داخل توانایی</span>
                      <select value={selectedChoiceKey} onChange={(event) => setSelectedChoiceKey(event.target.value)}>
                        {selectedAction.choices.map((choice) => (
                          <option key={choice.id} value={choice.id}>
                            {choice.label} ({usageLabel(choice.usesPerGame)}، {effectLabel(choice.effectType)})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {canChooseReportEffect ? (
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">نوع ثبت این اتفاق</span>
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

                  <div className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-950">
                    {[
                      { value: true, label: "استفاده شد", icon: "check_circle" },
                      { value: false, label: "استفاده نشد", icon: "radio_button_unchecked" },
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
                            : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">انجام‌دهنده</span>
                    <select value={actorPlayerId} onChange={(event) => setActorPlayerId(event.target.value)}>
                      <option value="">{selectedAction?.source === "side" ? "ثبت به نام جبهه" : "انتخاب بازیکن"}</option>
                      {selectedAction?.candidates.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} - {player.role?.name || selectedAction.sourceLabel}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                      {usesTargetSlotChoices
                        ? selectedAction.choices[0]?.label || "گزینه ۱"
                        : selectedEffectType === "TWO_NAME_INQUIRY"
                          ? "اسم اول"
                          : selectedEffectType === "YAKUZA"
                            ? "بازیکن خریداری‌شونده"
                            : "هدف یا اثر"}
                    </span>
                    <select value={targetPlayerId} onChange={(event) => setTargetPlayerId(event.target.value)} disabled={!eventWasUsed}>
                      <option value="">انتخاب بازیکن</option>
                      {targetPlayerOptions.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} {player.isAlive === false ? "(حذف‌شده)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  {needsSecondaryTarget && (
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                        {selectedEffectType === "YAKUZA"
                          ? "مافیای قربانی یاکوزا"
                          : usesTargetSlotChoices
                            ? selectedAction.choices[1]?.label || "گزینه ۲"
                            : selectedEffectType === "TWO_NAME_INQUIRY"
                              ? "اسم دوم بازپرسی"
                              : "هدف دوم"}
                      </span>
                      <select value={secondaryTargetPlayerId} onChange={(event) => setSecondaryTargetPlayerId(event.target.value)} disabled={!eventWasUsed}>
                        <option value="">انتخاب بازیکن</option>
                        {secondaryTargetOptions.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name} - {player.role?.name || "بدون نقش"} {player.isAlive === false ? "(حذف‌شده)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {extraTargetSlots > 0 && (
                    <div className="grid gap-2">
                      {Array.from({ length: extraTargetSlots }).map((_, index) => (
                        <label key={`extra-target-${index}`} className="flex flex-col gap-2">
                          <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                            {usesTargetSlotChoices ? selectedAction.choices[index + 2]?.label || `گزینه ${index + 3}` : `هدف ${index + 3}`}
                          </span>
                          <select
                            value={extraTargetPlayerIds[index] || ""}
                            onChange={(event) =>
                              setExtraTargetPlayerIds((current) => {
                                const next = [...current];
                                next[index] = event.target.value;
                                return next;
                              })
                            }
                            disabled={!eventWasUsed}
                          >
                            <option value="">انتخاب بازیکن</option>
                            {players.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name} - {player.role?.name || "بدون نقش"} {player.isAlive === false ? "(حذف‌شده)" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  )}

                  {needsConversionRole && (
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">نقش مافیایی بعد از خریداری</span>
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
                    <div className="rounded-lg border border-lime-500/20 bg-lime-500/10 p-3 text-xs font-bold leading-6 text-lime-700 dark:text-lime-300">
                      رفتار ثبت‌شده: {effectLabel(selectedEffectType)}
                    </div>
                  )}

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">یادداشت اختیاری</span>
                    <textarea
                      value={nightNote}
                      onChange={(event) => setNightNote(event.target.value.slice(0, 500))}
                      placeholder="مثلاً دکتر این بازیکن را نجات داد."
                      className="min-h-24 resize-none"
                    />
                  </label>

                  <button
                    onClick={handleRecordNightEvent}
                    disabled={busy || game?.status === "FINISHED"}
                    className="ui-button-primary min-h-11 w-full"
                  >
                    <span className="material-symbols-outlined text-xl">add_notes</span>
                    ثبت در شب {nightNumber}
                  </button>

                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-zinc-950 dark:text-white">ثبت حذف روز</p>
                        <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">رای‌گیری، شلیک روز، بازپرسی یا هر روش سناریویی.</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-white/70 p-1 dark:bg-zinc-950/50">
                        <button type="button" onClick={() => setDayNumber((value) => Math.max(1, value - 1))} className="flex size-7 items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10">
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="w-7 text-center text-xs font-black text-zinc-950 dark:text-white">{dayNumber}</span>
                        <button type="button" onClick={() => setDayNumber((value) => value + 1)} className="flex size-7 items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10">
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-amber-500/20 bg-white/70 p-1 dark:bg-zinc-950/50">
                      {DAY_ELIMINATION_METHODS.map((method) => (
                        <button
                          key={method.key}
                          type="button"
                          onClick={() => setDayMethodKey(method.key)}
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

                    <label className="mt-3 flex flex-col gap-2">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300">بازیکن حذف‌شده</span>
                      <select value={dayTargetPlayerId} onChange={(event) => setDayTargetPlayerId(event.target.value)} disabled={game?.status === "FINISHED"}>
                        <option value="">انتخاب بازیکن</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name} - {player.role?.name || "بدون نقش"} {player.isAlive === false ? "(حذف‌شده)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>

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
                      disabled={busy || game?.status === "FINISHED"}
                      className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-black text-zinc-950 transition-all hover:bg-amber-400 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">person_remove</span>
                      ثبت حذف روز {dayNumber}
                    </button>
                  </div>
                </div>
              </aside>

              <section className="min-w-0">
                {reportRounds.length === 0 ? (
                  <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="ui-icon size-16">
                      <span className="material-symbols-outlined text-3xl text-zinc-400">dark_mode</span>
                    </div>
                    <div>
                      <p className="font-black text-zinc-950 dark:text-white">هنوز گزارشی ثبت نشده است</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">اتفاقات شب و حذف‌های روز در یک گزارش فشرده کنار هم می‌آیند.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {reportRounds.map((round) => (
                      <article key={round.round} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950/60">
                          <div>
                            <p className="text-sm font-black text-zinc-950 dark:text-white">دور {round.round}</p>
                            <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                              {round.night.length} رکورد شب، {round.day.length} حذف روز
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-1 text-[10px] font-black text-lime-700 dark:text-lime-300">شب {round.round}</span>
                            <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">روز {round.round}</span>
                          </div>
                        </div>

                        <div className="grid gap-3 p-3">
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-black text-zinc-500 dark:text-zinc-400">
                              <span className="material-symbols-outlined text-base text-lime-500">dark_mode</span>
                              اتفاقات شب
                            </div>
                            <div className="space-y-2">
                              {round.night.length > 0 ? (
                                round.night.map((event) => (
                                  <ReportEventRow key={event.id} event={event} busy={busy} onDelete={handleDeleteNightEvent} />
                                ))
                              ) : (
                                <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-3 text-xs font-bold text-zinc-400 dark:border-white/10 dark:bg-zinc-950/40">
                                  رکورد شب ندارد.
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-black text-zinc-500 dark:text-zinc-400">
                              <span className="material-symbols-outlined text-base text-amber-500">wb_sunny</span>
                              حذف‌های روز
                            </div>
                            <div className="space-y-2">
                              {round.day.length > 0 ? (
                                round.day.map((event) => (
                                  <ReportEventRow key={event.id} event={event} busy={busy} onDelete={handleDeleteNightEvent} />
                                ))
                              ) : (
                                <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-3 text-xs font-bold text-zinc-400 dark:border-white/10 dark:bg-zinc-950/40">
                                  حذف روز ثبت نشده است.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:h-fit">
          <section className="ui-card overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="ui-kicker">اتاق نتیجه</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">انتخاب برنده</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                اگر بازی بعد از ۸ ساعت بسته نشود، سیستم آن را با برنده نامشخص می‌بندد.
              </p>
            </div>

            <div className="grid gap-3 p-4">
              {[
                { key: "CITIZEN" as const, label: "پیروزی شهروندان", icon: "verified_user", className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
                { key: "MAFIA" as const, label: "پیروزی مافیا", icon: "local_police", className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300" },
                { key: "NEUTRAL" as const, label: "پیروزی مستقل‌ها", icon: "casino", className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
                { key: "UNKNOWN" as const, label: "برنده نامشخص", icon: "help", className: "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-300" },
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

          <section className="ui-card p-5">
            <p className="ui-kicker">راهنمای اجرای سریع</p>
            <div className="mt-4 space-y-3">
              {[
                ["person_off", "حذف‌شده‌ها", "بازیکن حذف‌شده در صفحه بازی برای بقیه هم مشخص می‌شود."],
                ["dark_mode", "دفترچه شب", "ثبت اتفاق شب اختیاری است و تا وقتی عمومی نشود فقط برای گرداننده می‌ماند."],
                ["timer", "بستن خودکار", "بازی‌های باز بعد از ۸ ساعت با نتیجه نامشخص بسته می‌شوند."],
              ].map(([icon, title, text]) => (
                <div key={title} className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="material-symbols-outlined text-xl text-lime-500">{icon}</span>
                  <div>
                    <p className="text-sm font-black text-zinc-950 dark:text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{text}</p>
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
