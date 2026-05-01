"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPlayerGameView } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import Link from "next/link";
import { usePopup } from "@/components/PopupProvider";

function alignmentLabel(alignment?: string) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment?: string) {
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
}

function effectLabel(effectType?: string) {
  if (effectType === "CONVERT_TO_MAFIA") return "خریداری";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره";
  return "ثبت ساده";
}

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "؟";
}

export default function UserGamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { showAlert } = usePopup();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [myPlayerInfo, setMyPlayerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revealRole, setRevealRole] = useState(false);

  useEffect(() => {
    if (!gameId || !session?.user?.id) return;

    const syncGameView = async () => {
      const res = await getPlayerGameView(gameId);
      if (!res || res.status !== "IN_PROGRESS") {
        router.push(res?.status === "WAITING" ? `/lobby/${gameId}` : "/dashboard/user");
        return;
      }
      
      setGame(res);
      setMyPlayerInfo(res.myPlayer);
      
      setLoading(false);
    };

    syncGameView();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    
    // Listen for game end
    channel.bind('game-ended', (data: { winningAlignment: string }) => {
      const winnerStr = data.winningAlignment === 'CITIZEN' ? 'شهروندان' : data.winningAlignment === 'MAFIA' ? 'مافیا' : data.winningAlignment === 'NEUTRAL' ? 'مستقل‌ها' : 'نامشخص';
      showAlert("پایان بازی", `بازی به پایان رسید! تیم پیروز: ${winnerStr}`, "info");
      router.push("/dashboard/user");
    });

    channel.bind("player-status-updated", () => {
      syncGameView();
    });

    channel.bind("game-state-updated", () => {
      syncGameView();
    });

    channel.bind("night-records-public", () => {
      syncGameView();
    });

    // Listen for game cancellation
    channel.bind('game-cancelled', () => {
      showAlert("لغو بازی", "بازی توسط گرداننده لغو شد.", "warning");
      router.push("/dashboard/user");
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, session?.user?.id, router, showAlert]);

  const role = myPlayerInfo?.role;
  const scenarioRoles = useMemo(
    () =>
      (game?.scenario?.roles || []).map((scenarioRole: any) => ({
        id: scenarioRole.roleId,
        name: scenarioRole.role?.name || "نقش",
        description: scenarioRole.role?.description || "",
        alignment: scenarioRole.role?.alignment,
        count: scenarioRole.count,
      })),
    [game]
  );
  const scenarioCounts = useMemo(
    () =>
      scenarioRoles.reduce(
        (counts: Record<string, number>, scenarioRole: any) => {
          counts[scenarioRole.alignment || "NEUTRAL"] += scenarioRole.count;
          counts.total += scenarioRole.count;
          return counts;
        },
        { CITIZEN: 0, MAFIA: 0, NEUTRAL: 0, total: 0 }
      ),
    [scenarioRoles]
  );
  const players = game?.players || [];
  const publicNightEvents = game?.nightEvents || [];
  const groupedNightEvents = useMemo(() => {
    const groups = new Map<number, any[]>();
    publicNightEvents.forEach((event: any) => {
      const existing = groups.get(event.nightNumber) || [];
      groups.set(event.nightNumber, [...existing, event]);
    });
    return [...groups.entries()].sort(([left], [right]) => left - right);
  }, [publicNightEvents]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4" dir="rtl">
        <div className="ui-card w-full max-w-lg overflow-hidden text-center">
          <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-300" />
          <div className="p-8">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-lime-500 text-zinc-950 shadow-lg shadow-lime-500/20">
              <span className="material-symbols-outlined animate-spin text-3xl leading-none">progress_activity</span>
            </div>
            <p className="mt-5 text-lg font-black text-zinc-950 dark:text-white">در حال آماده‌سازی کارت نقش</p>
            <p className="mt-2 text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400">
              نقش، سناریو و گزارش‌های عمومی بازی در حال دریافت هستند.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!myPlayerInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <span className="material-symbols-outlined text-6xl text-zinc-300">error</span>
        <h2 className="text-2xl font-bold">شما در این بازی حضور ندارید!</h2>
        <Link href={`/lobby/${gameId}`} className="px-6 py-2 bg-zinc-900 text-white rounded-lg mt-4">بازگشت به لابی</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-6" dir="rtl">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(320px,430px)_minmax(0,1fr)]">
        <section className="ui-card relative flex flex-col items-center overflow-hidden p-6 sm:p-8">
          {revealRole && (
            <div className={`pointer-events-none absolute inset-0 opacity-10 transition-opacity duration-1000 ${
              role?.alignment === 'CITIZEN' ? 'bg-blue-500' :
              role?.alignment === 'MAFIA' ? 'bg-red-500' :
              'bg-amber-500'
            }`}></div>
          )}

          <div className="z-10 mb-6 text-center">
            <p className="ui-kicker">کارت محرمانه</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">نقش شما</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">نقش خود را فقط در محیط امن ببینید.</p>
          </div>

          <div
            onClick={() => setRevealRole(!revealRole)}
            className={`relative z-10 aspect-[2/3] w-full max-w-sm cursor-pointer rounded-lg transition-all duration-700 preserve-3d ${revealRole ? '[transform:rotateY(180deg)]' : ''}`}
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border-4 border-zinc-800 bg-zinc-950 p-6 shadow-2xl backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
              <div className="mb-4 flex size-24 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <span className="material-symbols-outlined text-5xl text-zinc-700">visibility_off</span>
              </div>
              <p className="mb-2 text-lg font-black text-white">برای مشاهده نقش ضربه بزنید</p>
              <p className="text-center text-xs leading-5 text-zinc-500">پس از دیدن، دوباره کارت را مخفی کنید.</p>
            </div>

            <div className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-lg border-4 p-6 shadow-2xl backface-hidden ${
              role?.alignment === 'CITIZEN' ? 'border-blue-800 bg-blue-950' :
              role?.alignment === 'MAFIA' ? 'border-red-800 bg-red-950' :
              'border-amber-800 bg-amber-950'
            }`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="absolute top-0 w-full bg-black/20 py-2 text-center text-xs font-black text-white/55">
                تیم {alignmentLabel(role?.alignment)}
              </div>

              <div className="flex w-full flex-1 flex-col items-center justify-center">
                <h2 className="mb-4 text-center text-4xl font-black text-white drop-shadow-md">{role?.name || "بدون نقش"}</h2>
                <div className="w-full rounded-lg border border-white/10 bg-black/20 p-4 text-center">
                  <p className="text-sm leading-7 text-white/85">{role?.description || "توضیحی برای این نقش وجود ندارد."}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 text-xs text-white/45">برای مخفی کردن دوباره ضربه بزنید</div>
            </div>
          </div>

          <Link href="/dashboard/user" className="ui-button-secondary z-10 mt-6 min-h-12 w-full max-w-sm">
            <span className="material-symbols-outlined text-xl">dashboard</span>
            بازگشت به داشبورد
          </Link>
        </section>

        <aside className="ui-card overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="ui-kicker">راهنمای سناریو</p>
                <h2 className="mt-1 truncate text-2xl font-black text-zinc-950 dark:text-white">{game?.scenario?.name || "سناریو"}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {game?.scenario?.description || "ترکیب نقش‌های این بازی را بدون نمایش نقش بازیکنان ببینید."}
                </p>
              </div>
              <span className="material-symbols-outlined flex size-12 shrink-0 rounded-lg bg-lime-500 text-2xl text-zinc-950">menu_book</span>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                ["کل", scenarioCounts.total, "text-lime-600 dark:text-lime-300"],
                ["شهروند", scenarioCounts.CITIZEN, "text-sky-600 dark:text-sky-300"],
                ["مافیا", scenarioCounts.MAFIA, "text-red-600 dark:text-red-300"],
                ["مستقل", scenarioCounts.NEUTRAL, "text-amber-600 dark:text-amber-300"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-lg border border-zinc-200 bg-white p-3 text-center dark:border-white/10 dark:bg-zinc-950/60">
                  <p className={`text-lg font-black ${color}`}>{value}</p>
                  <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/60">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black text-zinc-950 dark:text-white">وضعیت بازیکنان</p>
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  {players.filter((player: any) => player.isAlive !== false).length} فعال
                </span>
              </div>
              <div className="grid gap-2">
                {players.map((player: any) => {
                  const alive = player.isAlive !== false;
                  return (
                    <div key={player.id} className={alive ? "relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-white/10 dark:bg-white/[0.03]" : "relative overflow-hidden rounded-lg border border-red-500/20 bg-red-500/10 p-2"}>
                      <div className={`absolute inset-y-2 right-0 w-1 rounded-l-full ${alive ? "bg-lime-500" : "bg-red-500"}`} />
                      <div className="flex items-center justify-between gap-2 pr-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-black ${alive ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-red-500 text-white"}`}>
                            {player.image ? <img src={player.image} alt="" className="size-full object-cover" /> : getInitial(player.name)}
                          </div>
                          <p className="truncate text-xs font-black text-zinc-950 dark:text-white">{player.name}</p>
                        </div>
                        <span className={alive ? "rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-0.5 text-[9px] font-black text-lime-700 dark:text-lime-300" : "rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-black text-red-600 dark:text-red-300"}>
                          {alive ? "فعال" : "حذف‌شده"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="custom-scrollbar max-h-[62vh] overflow-y-auto p-5">
            {scenarioRoles.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {scenarioRoles.map((scenarioRole: any) => (
                  <div key={scenarioRole.id || scenarioRole.name} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{scenarioRole.name}</p>
                        <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(scenarioRole.alignment)}`}>
                          {alignmentLabel(scenarioRole.alignment)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(scenarioRole.alignment)}`}>
                        x{scenarioRole.count}
                      </span>
                    </div>
                    {scenarioRole.description && (
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{scenarioRole.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <span className="material-symbols-outlined text-4xl text-zinc-400">account_tree</span>
                <p className="text-sm font-black text-zinc-950 dark:text-white">راهنمایی برای این سناریو ثبت نشده است</p>
              </div>
            )}

            {groupedNightEvents.length > 0 && (
              <div className="mt-5 rounded-lg border border-lime-500/20 bg-lime-500/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lime-600 dark:text-lime-300">dark_mode</span>
                  <p className="text-sm font-black text-zinc-950 dark:text-white">دفترچه عمومی شب</p>
                </div>
                <div className="mt-3 space-y-2">
                  {groupedNightEvents.map(([nightNumber, events]) => (
                    <details key={nightNumber} className="group rounded-lg border border-lime-500/20 bg-white/70 dark:bg-zinc-950/60">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3">
                        <span className="text-xs font-black text-zinc-950 dark:text-white">شب {nightNumber}</span>
                        <span className="material-symbols-outlined text-zinc-400 transition-transform group-open:rotate-180">keyboard_arrow_down</span>
                      </summary>
                      <div className="space-y-2 border-t border-lime-500/20 p-3">
                        {events.map((event: any) => (
                          <div key={event.id} className="rounded-lg bg-white p-2 text-xs leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black text-zinc-950 dark:text-white">
                                {event.abilityLabel}{event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}
                              </p>
                              <span className={event.wasUsed === false ? "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300" : "rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-0.5 text-[10px] font-black text-lime-700 dark:text-lime-300"}>
                                {event.wasUsed === false ? "استفاده نشد" : "استفاده شد"}
                              </span>
                              {event.details?.effectType && event.details.effectType !== "NONE" && (
                                <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-black text-sky-700 dark:text-sky-300">
                                  {effectLabel(event.details.effectType)}
                                </span>
                              )}
                            </div>
                            <p className="mt-1">
                              {event.actorPlayer?.name || event.abilitySource || (event.actorAlignment ? alignmentLabel(event.actorAlignment) : "نامشخص")}
                              {event.wasUsed === false ? " ← بدون هدف" : ` ← ${event.targetPlayer?.name || "نامشخص"}`}
                            </p>
                            {Array.isArray(event.details?.targetLabels) && event.details.targetLabels.length > 0 && (
                              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                                گزینه‌ها: {event.details.targetLabels.map((target: { label: string; playerName?: string | null }) => `${target.label}: ${target.playerName || "نامشخص"}`).join("، ")}
                              </p>
                            )}
                            {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && event.details?.secondaryTargetName && (
                              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                                {event.details.effectType === "YAKUZA" ? "قربانی یاکوزا" : "هدف دوم"}: {event.details.secondaryTargetName}
                              </p>
                            )}
                            {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && Array.isArray(event.details?.extraTargets) && event.details.extraTargets.length > 0 && (
                              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                                هدف‌های اضافه: {event.details.extraTargets.map((target: { name: string }) => target.name).join("، ")}
                              </p>
                            )}
                            {event.details?.convertedRoleName && (
                              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                                تبدیل نقش: {event.details.previousRoleName || "نقش قبلی"} ← {event.details.convertedRoleName}
                              </p>
                            )}
                            {event.note && <p className="mt-1 text-zinc-500 dark:text-zinc-400">{event.note}</p>}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
