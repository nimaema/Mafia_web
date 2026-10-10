"use client";

import { useMemo } from "react";
import { Trophy, XCircle } from "@phosphor-icons/react";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
import { GameReportTimeline } from "@/components/game/GameReportTimeline";
import { FactionTag } from "@/components/ui/Tag";
import { Sheet } from "@/components/ui/Sheet";
import { assignTableHues } from "@/lib/playerColor";

export type HistoryItem = {
  id: string;
  gameName: string;
  gameCode: string | null;
  roleName: string;
  roleAlignment: string;
  result: "WIN" | "LOSS" | "PENDING";
  date: string;
  scenarioName: string;
  scenarioDescription: string;
  moderatorName: string;
  playerCount: number;
  players: {
    name: string;
    roleName: string;
    alignment: string;
    isAlive?: boolean;
  }[];
  nightRecordsPublic?: boolean;
  nightEvents?: {
    id: string;
    nightNumber: number;
    abilityLabel: string;
    abilityChoiceLabel?: string | null;
    abilitySource?: string | null;
    actorName?: string | null;
    targetName?: string | null;
    actorAlignment?: string | null;
    wasUsed?: boolean;
    details?: {
      phase?: "NIGHT" | "DAY";
      methodKey?: string | null;
      methodLabel?: string | null;
      effectType?: string;
      secondaryTargetName?: string | null;
      extraTargets?: { id: string; name: string }[];
      targetLabels?: { label: string; playerName?: string | null }[];
      convertedRoleName?: string | null;
      previousRoleName?: string | null;
      sacrificePlayerName?: string | null;
      defensePlayers?: { id?: string | null; name: string; roleName?: string | null }[];
    } | null;
    note?: string | null;
  }[];
};

export const RESULT = {
  WIN: { word: "بردید", short: "برد", surface: "bg-day text-day-ink", chip: "bg-success/14 text-success", Icon: Trophy },
  LOSS: { word: "باختید", short: "باخت", surface: "bg-verdict text-verdict-ink", chip: "bg-danger/12 text-danger", Icon: XCircle },
  PENDING: { word: "نتیجه نامعلوم", short: "نامعلوم", surface: "bg-night text-moon", chip: "bg-raised text-muted", Icon: XCircle },
} as const;

export function CaseFile({ game, onClose }: { game: HistoryItem; onClose: () => void }) {
  const result = RESULT[game.result] || RESULT.PENDING;
  const hues = useMemo(() => assignTableHues(game.players.map((player) => player.name)), [game]);

  return (
    <Sheet
      open
      onClose={onClose}
      size="lg"
      title={`${game.scenarioName}، ${result.word}`}
      header={
        <div className={`nq-grain relative overflow-hidden px-6 pb-6 pt-14 ${result.surface}`}>
          <p className="relative z-10 text-sm font-bold opacity-80">{`${game.date} · گرداننده: ${game.moderatorName}`}</p>
          <p className="nq-display relative z-10 mt-1 text-[3.2rem] leading-none">{result.word}</p>
          <p className="relative z-10 mt-2 font-bold opacity-90">{`${game.scenarioName} · شما ${game.roleName} بودید`}</p>
        </div>
      }
    >
      <section aria-labelledby="unmasked-title">
        <h3 id="unmasked-title" className="text-lg font-extrabold">
          نقاب‌ها برداشته شد
        </h3>
        <ul className="mt-3 grid gap-x-4 sm:grid-cols-2">
          {game.players.map((player, index) => (
            <li key={`${player.name}-${index}`} className="flex items-center gap-3 border-b border-line py-2.5">
              <MaskAvatar seed={player.name} hue={hues.get(player.name)} size="sm" eliminated={player.isAlive === false} />
              <span className="min-w-0 flex-1">
                <span className={`block truncate font-bold ${player.isAlive === false ? "text-muted line-through" : ""}`}>{player.name}</span>
                <span className="block truncate text-sm font-medium text-muted">{player.roleName}</span>
              </span>
              <FactionTag alignment={player.alignment} />
            </li>
          ))}
        </ul>
      </section>

      {game.nightEvents && game.nightEvents.length > 0 ? (
        <GameReportTimeline events={game.nightEvents} title="داستان بازی" subtitle="روز به روز و شب به شب، همان‌طور که گرداننده ثبت کرد." isPublic={game.nightRecordsPublic} className="mt-8" />
      ) : (
        <p className="mt-8 rounded-[var(--radius-md)] bg-raised p-4 text-sm font-medium leading-7 text-muted">گرداننده گزارش شب‌های این بازی را منتشر نکرده است.</p>
      )}
    </Sheet>
  );
}
