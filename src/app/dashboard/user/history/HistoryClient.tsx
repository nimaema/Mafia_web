"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { getUserHistoryPage } from "@/actions/dashboard";
import { MaskStack } from "@/components/brand/MaskAvatar";
import { CaseFile, RESULT, type HistoryItem } from "@/components/game/CaseFile";

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
