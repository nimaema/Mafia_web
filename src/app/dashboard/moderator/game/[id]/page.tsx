"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { endGame, getGameStatus, publishNightRecords, recordDayElimination, recordNightEvent, setPlayerAliveStatus } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";

type Phase = "روز" | "شب";

function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false);
          try {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = 880;
            gain.gain.value = 0.18;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            setTimeout(() => {
              oscillator.stop();
              context.close();
            }, 900);
          } catch {}
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  return { seconds, setSeconds, running, setRunning };
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

export default function ModeratorGamePage() {
  const params = useParams();
  const router = useRouter();
  const { showConfirm, showToast } = usePopup();
  const gameId = params.id as string;
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("روز");
  const [phaseNo, setPhaseNo] = useState(1);
  const [targetSheet, setTargetSheet] = useState<string | null>(null);
  const [eventNote, setEventNote] = useState("");
  const turnTimer = useTimer(180);
  const challengeTimer = useTimer(45);

  useEffect(() => {
    const syncGame = async () => {
      const res = await getGameStatus(gameId);
      if (!res) {
        router.push("/dashboard/moderator");
        return;
      }
      setGame(res);
      setLoading(false);
    };

    syncGame();
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    channel.bind("game-state-updated", syncGame);
    channel.bind("player-status-updated", syncGame);
    channel.bind("night-records-public", syncGame);
    channel.bind("game-ended", syncGame);
    return () => pusher.unsubscribe(`game-${gameId}`);
  }, [gameId, router]);

  if (loading) return <EmptyState icon="progress_activity" title="در حال آماده‌سازی کنترل بازی..." />;

  const players = [...(game.players || [])].sort((a: any, b: any) => Number(a.isAlive === false) - Number(b.isAlive === false));
  const reports = game.nightEvents || [];
  const advancePhase = () => {
    if (phase === "روز") setPhase("شب");
    else {
      setPhase("روز");
      setPhaseNo((value) => value + 1);
    }
  };

  const refreshGame = async () => {
    const fresh = await getGameStatus(gameId);
    if (fresh) setGame(fresh);
  };

  const addEvent = async (player: any, action: string) => {
    let result: any;
    if (action === "حذف روز" || action === "رای‌گیری / دفاع") {
      result = await recordDayElimination(gameId, {
        dayNumber: phaseNo,
        targetPlayerId: action === "حذف روز" ? player.id : undefined,
        defensePlayerIds: action === "رای‌گیری / دفاع" ? [player.id] : [],
        methodKey: action === "رای‌گیری / دفاع" ? "vote" : "custom",
        methodLabel: action,
        note: eventNote,
      });
      if (!result.error && action === "حذف روز") await setPlayerAliveStatus(gameId, player.id, false);
    } else {
      result = await recordNightEvent(gameId, {
        nightNumber: phaseNo,
        abilityKey: action === "شلیک مافیا" ? "mafia-shot" : `manual:${action}`,
        abilityLabel: action,
        abilitySource: action === "شلیک مافیا" ? "جبهه مافیا" : player.role?.name || "گزارش دستی",
        actorPlayerId: action === "شلیک مافیا" ? undefined : player.id,
        targetPlayerId: action === "بدون استفاده" ? undefined : player.id,
        actorAlignment: action === "شلیک مافیا" ? "MAFIA" : player.role?.alignment,
        wasUsed: action !== "بدون استفاده",
        note: eventNote,
      });
      if (!result.error && action === "شلیک مافیا") {
        showConfirm("نتیجه شلیک", "آیا این بازیکن در پایان شب کشته شد؟", async () => {
          await setPlayerAliveStatus(gameId, player.id, false);
          await refreshGame();
          showToast("بازیکن حذف شد", "success");
        }, "warning");
      }
    }

    if (result?.error) showToast(result.error, "error");
    else showToast("گزارش ثبت شد", "success");
    setEventNote("");
    setTargetSheet(null);
    await refreshGame();
  };

  const finishGame = (winner: "CITIZEN" | "MAFIA" | "NEUTRAL") => {
    showConfirm("پایان بازی", "نتیجه برای بازیکنان ثبت می‌شود. ادامه می‌دهید؟", async () => {
      await endGame(gameId, winner);
      showToast("بازی پایان یافت", "success");
      await refreshGame();
    });
  };

  const publishReport = () => {
    showConfirm("عمومی کردن گزارش", "بازیکنان این بازی گزارش روز و شب را در تاریخچه خود می‌بینند. ادامه می‌دهید؟", async () => {
      const result = await publishNightRecords(gameId);
      if (result.success) {
        showToast("گزارش عمومی شد", "success");
        await refreshGame();
      } else {
        showToast(result.error || "انتشار گزارش انجام نشد", "error");
      }
    }, "warning");
  };

  return (
    <div className="space-y-5">
      <CommandSurface className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <StatusChip tone="emerald" pulse>Live Game</StatusChip>
            <h1 className="mt-3 text-2xl font-black text-zinc-50">{game.name || "بازی در جریان"}</h1>
            <p className="mt-1 text-sm text-zinc-400">{game.scenario?.name || "سناریو"} · #{game.code}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="مرحله" value={`${phase} ${phaseNo}`} tone={phase === "روز" ? "amber" : "violet"} />
            <StatCell label="بازیکن" value={players.length} tone="cyan" />
            <StatCell label="کد" value={game.code} tone="emerald" />
          </div>
        </div>
      </CommandSurface>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <SectionHeader title="تایمرها" eyebrow="Twin Timers" icon="timer" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["نوبت اصلی", turnTimer, 180],
              ["چالش", challengeTimer, 45],
            ].map(([label, timer, fallback]: any) => (
              <CommandSurface key={label} className="p-4">
                <p className="text-sm font-black text-zinc-300">{label}</p>
                <p className="mt-3 font-mono text-5xl font-black text-cyan-100">{formatTime(timer.seconds)}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={() => timer.setRunning(!timer.running)} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">{timer.running ? "توقف" : "شروع"}</button>
                  <button onClick={() => timer.setSeconds(Math.max(0, timer.seconds + 15))} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black">+۱۵</button>
                  <button onClick={() => timer.setSeconds(fallback)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black">ریست</button>
                </div>
              </CommandSurface>
            ))}
          </div>

          <CommandSurface className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-zinc-50">ترتیب فازها</p>
                <p className="mt-1 text-sm text-zinc-400">از روز اول شروع می‌شود و با پایان هر فاز جلو می‌رود.</p>
              </div>
              <CommandButton tone="violet" onClick={advancePhase}>فاز بعد</CommandButton>
            </div>
          </CommandSurface>
        </div>

        <div className="space-y-3">
          <SectionHeader title="بازیکنان و رویداد" eyebrow="Event Capture" icon="fact_check" />
          <CommandSurface className="p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {players.map((player: any) => (
                <button key={player.id} onClick={() => setTargetSheet(player.id)} className="pm-ledger-row flex items-center justify-between gap-3 p-3 text-right">
                  <div className="min-w-0">
                    <p className="truncate font-black text-zinc-100">{player.name}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{player.role?.name || "بدون نقش"}</p>
                  </div>
                  <StatusChip tone={player.isAlive === false ? "rose" : player.role?.alignment === "MAFIA" ? "rose" : player.role?.alignment === "CITIZEN" ? "cyan" : "amber"}>
                    {player.isAlive === false ? "حذف‌شده" : "ثبت"}
                  </StatusChip>
                </button>
              ))}
            </div>
          </CommandSurface>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-3">
          <SectionHeader title="گزارش رویدادها" eyebrow="Timeline Report" icon="receipt_long" />
          {reports.length === 0 ? (
            <EmptyState icon="edit_note" title="هنوز رویدادی ثبت نشده" text="بازیکن را انتخاب کنید و اتفاق را به فاز جاری اضافه کنید." />
          ) : (
            <div className="space-y-2">
              {reports.map((event: any) => (
                <div key={event.id} className="pm-ledger-row p-3">
                  <p className="text-xs font-black text-cyan-100">دور {event.nightNumber}</p>
                  <p className="mt-1 text-sm font-black leading-6 text-zinc-200">{event.abilityLabel}{event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{event.actorName || event.abilitySource || "نامشخص"} {event.wasUsed === false ? "بدون هدف" : `← ${event.targetName || "نامشخص"}`}</p>
                  {event.note && <p className="mt-1 text-xs leading-5 text-zinc-400">{event.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <CommandSurface className="h-fit p-4">
          <p className="text-lg font-black text-zinc-50">پایان بازی</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">برنده را انتخاب کنید تا نتیجه ثبت شود.</p>
          <div className="mt-4 grid gap-2">
            <CommandButton tone="cyan" onClick={() => finishGame("CITIZEN")}>پیروزی شهروند</CommandButton>
            <CommandButton tone="rose" onClick={() => finishGame("MAFIA")}>پیروزی مافیا</CommandButton>
            <CommandButton tone="amber" onClick={() => finishGame("NEUTRAL")}>پیروزی مستقل</CommandButton>
            {game.status === "FINISHED" && !game.nightRecordsPublic && (
              <CommandButton tone="emerald" onClick={publishReport}>عمومی کردن گزارش</CommandButton>
            )}
          </div>
        </CommandSurface>
      </section>

      {targetSheet && (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
          <CommandSurface className="pm-safe-sheet w-full max-w-lg overflow-y-auto p-5">
            {(() => {
              const player = players.find((item: any) => item.id === targetSheet);
              if (!player) return null;
              return (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <StatusChip tone="violet">{phase} {phaseNo}</StatusChip>
                      <h3 className="mt-3 text-xl font-black text-zinc-50">{player.name}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{player.role?.name || "نقش ثبت نشده"}</p>
                    </div>
                    <button onClick={() => setTargetSheet(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  <textarea value={eventNote} onChange={(event) => setEventNote(event.target.value)} placeholder="یادداشت اختیاری برای این رویداد..." className="pm-input mt-5 min-h-24 px-4 py-3" />
                  <div className="mt-5 grid gap-2">
                    {["رای‌گیری / دفاع", "حذف روز", "شلیک مافیا", "نجات یا محافظت", "بازپرسی / توانایی نقش", "بدون استفاده"].map((label) => (
                      <button key={label} onClick={() => addEvent(player, label)} className="pm-ledger-row p-3 text-right font-black text-zinc-100">
                        {label}
                      </button>
                    ))}
                    <button onClick={async () => {
                      await setPlayerAliveStatus(gameId, player.id, player.isAlive === false);
                      setTargetSheet(null);
                      await refreshGame();
                    }} className="pm-ledger-row p-3 text-right font-black text-zinc-100">
                      {player.isAlive === false ? "برگرداندن به بازی" : "علامت حذف‌شده"}
                    </button>
                  </div>
                </>
              );
            })()}
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
