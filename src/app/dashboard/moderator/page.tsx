"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelGame, createGame, getModeratorGames } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";

export default function ModeratorDashboard() {
  const router = useRouter();
  const { showAlert, showConfirm, showToast } = usePopup();
  const [loading, setLoading] = useState(false);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    refreshGames();
  }, []);

  const refreshGames = async () => {
    setActiveGames(await getModeratorGames(Date.now()));
  };

  const handleCreateGame = async () => {
    setLoading(true);
    const res = await createGame(name.trim(), password.trim());
    if (res.success) {
      setShowCreateSheet(false);
      setName("");
      setPassword("");
      router.push(`/dashboard/moderator/lobby/${res.gameId}`);
    } else {
      showAlert("خطا", res.error || "خطا در ایجاد بازی", "error");
      setLoading(false);
    }
  };

  const handleCancelGame = async (gameId: string) => {
    showConfirm("لغو لابی", "این لابی و ورود بازیکنان آن حذف می‌شود. ادامه می‌دهید؟", async () => {
      const res = await cancelGame(gameId);
      if (res.success) {
        await refreshGames();
        showToast("لابی لغو شد", "success");
      } else {
        showAlert("خطا", res.error || "خطا در لغو بازی", "error");
      }
    }, "error");
  };

  const waiting = activeGames.filter((game) => game.status === "WAITING").length;
  const live = activeGames.filter((game) => game.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-5">
      <CommandSurface className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <StatusChip tone="violet">Moderator Control</StatusChip>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-50">کنترل بازی‌ها</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">لابی بسازید، بازی‌های فعال را مدیریت کنید و سریع وارد اتاق فرمان شوید.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="همه" value={activeGames.length} tone="cyan" />
            <StatCell label="انتظار" value={waiting} tone="amber" />
            <StatCell label="زنده" value={live} tone="emerald" />
          </div>
        </div>
        <CommandButton onClick={() => setShowCreateSheet(true)} className="mt-5 w-full sm:w-auto">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          ایجاد لابی جدید
        </CommandButton>
      </CommandSurface>

      <section className="space-y-3">
        <SectionHeader title="جلسه‌های فعال" eyebrow="Active Sessions" icon="view_timeline" />
        {activeGames.length === 0 ? (
          <EmptyState icon="videogame_asset_off" title="هیچ لابی فعالی نیست" action={<CommandButton onClick={() => setShowCreateSheet(true)}>ساخت لابی</CommandButton>} />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {activeGames.map((game) => {
              const capacity = game.scenario?.roles?.reduce((a: any, b: any) => a + b.count, 0) || "?";
              return (
                <CommandSurface key={game.id} interactive className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-black text-zinc-50">{game.name}</h2>
                        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-xs font-black text-cyan-100">#{game.code}</span>
                      </div>
                      <p className="mt-2 truncate text-sm text-zinc-400">{game.scenario?.name || "سناریو انتخاب نشده"}</p>
                    </div>
                    <StatusChip tone={game.status === "WAITING" ? "amber" : "emerald"} pulse={game.status === "IN_PROGRESS"}>
                      {game.status === "WAITING" ? "در انتظار" : "زنده"}
                    </StatusChip>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <StatCell label="بازیکن" value={`${game._count.players}/${capacity}`} tone="cyan" />
                    <StatCell label="وضعیت" value={game.status === "WAITING" ? "لابی" : "بازی"} tone={game.status === "WAITING" ? "amber" : "emerald"} />
                    <StatCell label="قفل" value={game.password ? "دارد" : "ندارد"} tone={game.password ? "amber" : "neutral"} />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <CommandButton href={game.status === "WAITING" ? `/dashboard/moderator/lobby/${game.id}` : `/dashboard/moderator/game/${game.id}`} className="flex-1">
                      ورود به مدیریت
                    </CommandButton>
                    <CommandButton tone="rose" onClick={() => handleCancelGame(game.id)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </CommandButton>
                  </div>
                </CommandSurface>
              );
            })}
          </div>
        )}
      </section>

      {showCreateSheet && (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
          <CommandSurface className="pm-safe-sheet w-full max-w-lg overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusChip tone="violet">Quick Create</StatusChip>
                <h3 className="mt-3 text-2xl font-black text-zinc-50">ساخت لابی</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">سناریو و نقش‌ها در مرحله بعد، داخل لابی تنظیم می‌شوند.</p>
              </div>
              <button onClick={() => setShowCreateSheet(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام لابی" className="pm-input h-12 px-4" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز اختیاری" className="pm-input h-12 px-4 text-left" dir="ltr" />
              <CommandButton onClick={handleCreateGame} disabled={loading} className="w-full">
                <span className="material-symbols-outlined text-[18px]">{loading ? "progress_activity" : "bolt"}</span>
                تولید کد و ورود به لابی
              </CommandButton>
            </div>
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
