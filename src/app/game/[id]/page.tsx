"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getGameStatus } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, StatusChip } from "@/components/CommandUI";

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
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!gameId || !session?.user?.id) return;
    getGameStatus(gameId).then((res) => {
      if (!res || res.status !== "IN_PROGRESS") {
        router.push("/dashboard/user");
        return;
      }
      setGame(res);
      setMyPlayerInfo(res.players?.find((p: any) => p.userId === session.user?.id));
      setLoading(false);
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    channel.bind("game-ended", (data: { winningAlignment: string }) => {
      const winnerStr = data.winningAlignment === "CITIZEN" ? "شهروندان" : data.winningAlignment === "MAFIA" ? "مافیا" : "مستقل‌ها";
      showAlert("پایان بازی", `بازی تمام شد. تیم پیروز: ${winnerStr}`, "info");
      router.push("/dashboard/user");
    });
    channel.bind("game-cancelled", () => {
      showAlert("لغو بازی", "بازی توسط گرداننده لغو شد.", "warning");
      router.push("/dashboard/user");
    });
    return () => pusher.unsubscribe(`game-${gameId}`);
  }, [gameId, session?.user?.id, router, showAlert]);

  if (loading) return <EmptyState icon="progress_activity" title="در حال دریافت نقش..." />;
  if (!myPlayerInfo) {
    return (
      <EmptyState icon="error" title="شما در این بازی نیستید" action={<CommandButton href="/dashboard/user">بازگشت</CommandButton>} />
    );
  }

  const role = myPlayerInfo.role;
  const alignmentTone = role?.alignment === "MAFIA" ? "rose" : role?.alignment === "CITIZEN" ? "cyan" : "amber";

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <CommandSurface className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <StatusChip tone="emerald" pulse>بازی زنده</StatusChip>
            <h1 className="mt-3 text-2xl font-black text-zinc-50">کارت نقش شما</h1>
            <p className="mt-1 text-sm leading-6 text-zinc-400">نقش را فقط وقتی کسی اطراف شما نیست ببینید.</p>
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
                <StatusChip tone={alignmentTone as any}>{role?.alignment === "MAFIA" ? "مافیا" : role?.alignment === "CITIZEN" ? "شهروند" : "مستقل"}</StatusChip>
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Scenario Guide</p>
              <h2 className="mt-2 text-xl font-black text-zinc-50">{game?.scenario?.name || "سناریو"}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">ترکیب نقش‌ها و راهنمای کلی سناریو را اینجا ببینید.</p>
            </div>
            <CommandButton tone="ghost" onClick={() => setShowGuide(true)}>
              مشاهده
            </CommandButton>
          </div>
        </CommandSurface>

        <CommandSurface className="p-5">
          <h3 className="text-lg font-black text-zinc-50">بازیکنان بازی</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {game?.players?.map((player: any, index: number) => (
              <div key={player.id} className="pm-ledger-row flex items-center gap-3 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xs font-black text-zinc-300">{index + 1}</span>
                <p className="truncate text-sm font-black text-zinc-100">{player.name}</p>
              </div>
            ))}
          </div>
        </CommandSurface>
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
              {game?.scenario?.roles?.map((item: any) => (
                <div key={item.roleId} className="pm-ledger-row flex items-center justify-between p-3">
                  <div>
                    <p className="font-black text-zinc-100">{item.role?.name}</p>
                    <p className="mt-1 text-xs text-zinc-400">{item.role?.description || "بدون توضیح"}</p>
                  </div>
                  <StatusChip tone={item.role?.alignment === "MAFIA" ? "rose" : item.role?.alignment === "CITIZEN" ? "cyan" : "amber"}>
                    ×{item.count}
                  </StatusChip>
                </div>
              ))}
            </div>
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
