"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight, Trophy, XCircle } from "@phosphor-icons/react";
import { getUserHistoryPage } from "@/actions/dashboard";
import { MaskAvatar, MaskStack } from "@/components/brand/MaskAvatar";
import { GameReportTimeline } from "@/components/game/GameReportTimeline";
import { FactionTag } from "@/components/ui/Tag";
import { Sheet } from "@/components/ui/Sheet";
import { assignTableHues } from "@/lib/playerColor";

type HistoryItem = {
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

type HistoryPageData = {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

const toFa = (value: number) => value.toLocaleString("fa-IR");

const RESULT = {
  WIN: { word: "بردید", short: "برد", surface: "bg-day text-day-ink", chip: "bg-success/14 text-success", Icon: Trophy },
  LOSS: { word: "باختید", short: "باخت", surface: "bg-verdict text-verdict-ink", chip: "bg-danger/12 text-danger", Icon: XCircle },
  PENDING: { word: "نتیجه نامعلوم", short: "نامعلوم", surface: "bg-night text-moon", chip: "bg-raised text-muted", Icon: XCircle },
} as const;

function CaseFile({ game, onClose }: { game: HistoryItem; onClose: () => void }) {
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

export function HistoryClient({ initialData }: { initialData: HistoryPageData }) {
  const [data, setData] = useState(initialData);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadPage = (page: number) => {
    startTransition(async () => {
      const next = await getUserHistoryPage(page, data.pageSize);
      setData(next);
      setSelected(null);
      window.scrollTo({ top: 0 });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="nq-display text-[2.6rem] leading-[1.15]">بازی‌های من</h1>
        <p className="mt-1 font-medium text-muted">
          {data.total ? `${toFa(data.total)} بازی ثبت شده. روی هر بازی بزنید تا نقش همه و داستان بازی را ببینید.` : "هنوز بازی‌ای ثبت نشده است."}
        </p>
      </header>

      {data.items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong p-8 text-center">
          <p className="font-extrabold">اولین بازی‌تان هنوز مانده</p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-medium leading-7 text-muted">بعد از پایان هر بازی، نتیجه، نقش همه و گزارش شب‌ها اینجا می‌ماند.</p>
          <Link href="/dashboard/user" className="nq-btn nq-btn-primary mt-5">
            پیدا کردن یک میز
          </Link>
        </div>
      ) : (
        <ul className={`flex flex-col gap-3 transition-opacity ${isPending ? "opacity-50" : ""}`}>
          {data.items.map((game) => {
            const result = RESULT[game.result] || RESULT.PENDING;
            return (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => setSelected(game)}
                  className="group flex w-full items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-4 text-right transition-colors hover:border-line-strong"
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-[0.9rem] ${result.chip}`}>
                    <result.Icon size={24} weight="fill" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-extrabold">{game.scenarioName}</span>
                      <span className={`nq-tag shrink-0 ${result.chip}`}>{result.short}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-muted">{`${game.roleName} · ${game.date} · ${toFa(game.playerCount)} نفر`}</span>
                    <MaskStack seeds={game.players.map((player) => player.name)} max={8} size="xs" ringClassName="ring-surface" className="mt-2.5" />
                  </span>
                  <CaretLeft size={20} weight="bold" className="shrink-0 text-muted transition-transform group-hover:-translate-x-1" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {data.totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-3" aria-label="صفحه‌های تاریخچه">
          <button type="button" onClick={() => loadPage(data.page - 1)} disabled={!data.hasPrevious || isPending} className="nq-btn nq-btn-secondary">
            <CaretRight size={18} weight="bold" aria-hidden />
            جدیدتر
          </button>
          <span className="text-sm font-bold text-muted">{`صفحه ${toFa(data.page + 1)} از ${toFa(data.totalPages)}`}</span>
          <button type="button" onClick={() => loadPage(data.page + 1)} disabled={!data.hasNext || isPending} className="nq-btn nq-btn-secondary">
            قدیمی‌تر
            <CaretLeft size={18} weight="bold" aria-hidden />
          </button>
        </nav>
      ) : null}

      {selected ? <CaseFile game={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
