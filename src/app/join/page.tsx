"use client";

import { useState } from "react";
import { joinGame } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, StatusChip } from "@/components/CommandUI";

export default function JoinGamePage() {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const { showAlert } = usePopup();

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const gameId = String(formData.get("gameId") || "").trim();
    const name = String(formData.get("name") || "").trim();
    if (!gameId || !name) {
      showAlert("اطلاعات ناقص", "کد بازی و نام نمایشی را کامل وارد کنید.", "warning");
      return;
    }

    setLoading(true);
    const result = await joinGame(gameId, name, String(formData.get("password") || ""));
    if (result.success) setJoined(true);
    else showAlert("خطا در ورود", result.error || "خطا در پیوستن به بازی", "error");
    setLoading(false);
  };

  return (
    <div className="pm-app-bg flex min-h-screen items-center justify-center px-4 text-zinc-100" dir="rtl">
      <CommandSurface className="w-full max-w-md p-5">
        {joined ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="material-symbols-outlined grid h-20 w-20 place-items-center rounded-[2rem] border border-emerald-300/25 bg-emerald-300/10 text-5xl text-emerald-100">
              check_circle
            </span>
            <div>
              <h1 className="text-2xl font-black text-zinc-50">وارد لابی شدید</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">منتظر شروع بازی توسط گرداننده بمانید.</p>
            </div>
            <StatusChip tone="emerald" pulse>در انتظار شروع</StatusChip>
          </div>
        ) : (
          <>
            <header className="mb-6 text-center">
              <span className="material-symbols-outlined mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                tag
              </span>
              <h1 className="text-2xl font-black text-zinc-50">ورود با کد</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">کد لابی را از گرداننده دریافت کنید.</p>
            </header>

            <form onSubmit={handleJoin} noValidate className="space-y-4">
              <input name="gameId" dir="ltr" placeholder="GAME CODE" className="pm-input h-12 px-4 text-center font-mono text-lg font-black uppercase tracking-[0.2em]" />
              <input name="name" placeholder="نام نمایشی شما" className="pm-input h-12 px-4" />
              <input name="password" type="password" dir="ltr" placeholder="رمز لابی، اگر وجود دارد" className="pm-input h-12 px-4 text-left" />
              <CommandButton type="submit" disabled={loading} className="w-full">
                <span className="material-symbols-outlined text-[18px]">login</span>
                {loading ? "در حال ورود..." : "پیوستن"}
              </CommandButton>
            </form>
          </>
        )}
      </CommandSurface>
    </div>
  );
}
