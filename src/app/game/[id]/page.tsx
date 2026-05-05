"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getPlayerGameView } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";

function alignmentLabel(alignment?: string) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentTone(alignment?: string) {
  if (alignment === "MAFIA") return "rose";
  if (alignment === "CITIZEN") return "cyan";
  return "amber";
}

function effectLabel(effectType?: string) {
  if (effectType === "CONVERT_TO_MAFIA") return "خریداری";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره";
  return "ثبت ساده";
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "؟";
}

export default function UserGamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { showAlert } = usePopup();
  const gameId = params.id as string;
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revealRole, setRevealRole] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!gameId || !session?.user?.id) return;

    const syncGameView = async () => {
      const res = await getPlayerGameView(gameId);
      if (!res || res.status !== "IN_PROGRESS") {
        router.push(res?.status === "WAITING" ? `/lobby/${gameId}` : "/dashboard/user");
        return;
      }
      setGame(res);
      setLoading(false);
    };

    syncGameView();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    channel.bind("game-ended", (data: { winningAlignment: string }) => {
      const winnerStr = data.winningAlignment === "CITIZEN" ? "شهروندان" : data.winningAlignment === "MAFIA" ? "مافیا" : data.winningAlignment === "NEUTRAL" ? "مستقل‌ها" : "نامشخص";
      showAlert("پایان بازی", `بازی تمام شد. تیم پیروز: ${winnerStr}`, "info");
      router.push("/dashboard/user");
    });
    channel.bind("game-cancelled", () => {
      showAlert("لغو بازی", "بازی توسط گرداننده لغو شد.", "warning");
      router.push("/dashboard/user");
    });
    channel.bind("player-status-updated", syncGameView);
    channel.bind("game-state-updated", syncGameView);
    channel.bind("night-records-public", syncGameView);
    return () => pusher.unsubscribe(`game-${gameId}`);
  }, [gameId, session?.user?.id, router, showAlert]);

  const myPlayerInfo = game?.myPlayer;
  const role = myPlayerInfo?.role;
  const players = game?.players || [];
  const scenarioRoles = game?.scenario?.roles || [];
  const groupedReports = useMemo(() => {
    const groups = new Map<number, any[]>();
    (game?.nightEvents || []).forEach((event: any) => {
      groups.set(event.nightNumber, [...(groups.get(event.nightNumber) || []), event]);
    });
    return [...groups.entries()].sort(([left], [right]) => left - right);
  }, [game?.nightEvents]);

  if (loading) return <EmptyState icon="progress_activity" title="در حال دریافت کارت نقش..." />;
  if (!myPlayerInfo) {
    return <EmptyState icon="error" title="شما در این بازی نیستید" action={<CommandButton href={`/lobby/${gameId}`}>بازگشت به لابی</CommandButton>} />;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <CommandSurface className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <StatusChip tone="emerald" pulse>بازی زنده</StatusChip>
            <h1 className="mt-3 text-2xl font-black text-zinc-50">کارت محرمانه نقش</h1>
            <p className="mt-1 text-sm leading-6 text-zinc-400">نقش را فقط وقتی محیط امن است باز کنید.</p>
          </div>
          <Link href="/dashboard/user" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>

        <button onClick={() => setRevealRole((value) => !value)} className="mt-6 w-full text-right">
          <div className={`relative aspect-[3/4] overflow-hidden rounded-[2rem] border p-5 transition-all ${revealRole ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/10 bg-white/[0.035]"}`}>
            {!revealRole ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="material-symbols-outlined text-6xl text-cyan-100/50">visibility_off</span>
                <p className="text-lg font-black text-zinc-50">برای نمایش نقش ضربه بزنید</p>
                <p className="text-xs leading-5 text-zinc-500">با ضربه دوباره مخفی می‌شود.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <StatusChip tone={alignmentTone(role?.alignment) as any}>{alignmentLabel(role?.alignment)}</StatusChip>
                <div>
                  <p className="text-4xl font-black tracking-tight text-zinc-50">{role?.name || "بدون نقش"}</p>
                  <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-300">{role?.description || "توضیحی برای این نقش ثبت نشده است."}</p>
                </div>
                <p className="text-xs font-bold text-zinc-500">برای مخفی کردن دوباره ضربه بزنید</p>
              </div>
            )}
          </div>
        </button>
      </CommandSurface>

      <div className="space-y-5">
        <CommandSurface className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <StatusChip tone="cyan">راهنمای سناریو</StatusChip>
              <h2 className="mt-3 text-2xl font-black text-zinc-50">{game?.scenario?.name || "سناریو"}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{game?.scenario?.description || "ترکیب نقش‌ها و وضعیت عمومی بازی را ببینید."}</p>
            </div>
            <CommandButton tone="ghost" onClick={() => setShowGuide(true)}>نمایش نقش‌ها</CommandButton>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatCell label="بازیکن فعال" value={players.filter((player: any) => player.isAlive !== false).length} tone="emerald" />
            <StatCell label="بازیکن حذف‌شده" value={players.filter((player: any) => player.isAlive === false).length} tone="rose" />
            <StatCell label="گزارش عمومی" value={groupedReports.length} tone="violet" />
          </div>
        </CommandSurface>

        <CommandSurface className="p-5">
          <SectionHeader title="وضعیت بازیکنان" eyebrow="Living Roster" icon="group" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[...players].sort((a: any, b: any) => Number(a.isAlive === false) - Number(b.isAlive === false)).map((player: any, index: number) => {
              const alive = player.isAlive !== false;
              return (
                <div key={player.id} className={`pm-ledger-row flex items-center justify-between gap-3 p-3 ${alive ? "" : "border-rose-300/25 bg-rose-400/10"}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-black ${alive ? "bg-cyan-300/10 text-cyan-100" : "bg-rose-400/20 text-rose-100"}`}>
                      {player.image ? <img src={player.image} alt="" className="h-full w-full object-cover" /> : getInitial(player.name || String(index + 1))}
                    </span>
                    <p className="truncate text-sm font-black text-zinc-100">{player.name}</p>
                  </div>
                  <StatusChip tone={alive ? "emerald" : "rose"}>{alive ? "فعال" : "حذف‌شده"}</StatusChip>
                </div>
              );
            })}
          </div>
        </CommandSurface>

        {groupedReports.length > 0 && (
          <CommandSurface className="p-5">
            <SectionHeader title="گزارش عمومی بازی" eyebrow="Published Report" icon="receipt_long" />
            <div className="mt-4 space-y-2">
              {groupedReports.map(([round, events]) => (
                <details key={round} className="group rounded-2xl border border-white/10 bg-white/[0.035]">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4">
                    <span className="text-sm font-black text-zinc-100">دور {round}</span>
                    <span className="material-symbols-outlined text-zinc-400 transition-transform group-open:rotate-180">keyboard_arrow_down</span>
                  </summary>
                  <div className="space-y-2 border-t border-white/10 p-3">
                    {events.map((event: any) => (
                      <div key={event.id} className="pm-ledger-row p-3 text-sm leading-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-zinc-100">{event.abilityLabel}{event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}</p>
                          <StatusChip tone={event.wasUsed === false ? "amber" : "emerald"}>{event.wasUsed === false ? "استفاده نشد" : "استفاده شد"}</StatusChip>
                          {event.details?.effectType && event.details.effectType !== "NONE" && <StatusChip tone="violet">{effectLabel(event.details.effectType)}</StatusChip>}
                        </div>
                        <p className="mt-1 text-zinc-400">{event.actorName || event.abilitySource || "نامشخص"} {event.wasUsed === false ? "بدون هدف" : `← ${event.targetName || "نامشخص"}`}</p>
                        {event.note && <p className="mt-1 text-zinc-500">{event.note}</p>}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </CommandSurface>
        )}
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
          <CommandSurface className="pm-safe-sheet w-full max-w-xl overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-zinc-50">{game?.scenario?.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">ترکیب نقش‌های سناریو</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="mt-5 grid gap-2">
              {scenarioRoles.map((item: any) => (
                <div key={item.roleId} className="pm-ledger-row flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-zinc-100">{item.role?.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{item.role?.description || "بدون توضیح"}</p>
                  </div>
                  <StatusChip tone={alignmentTone(item.role?.alignment) as any}>×{item.count}</StatusChip>
                </div>
              ))}
            </div>
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
