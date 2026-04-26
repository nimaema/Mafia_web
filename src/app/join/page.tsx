"use client";

import { useState } from "react";
import { joinGame } from "@/actions/game";

export default function JoinGamePage() {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const gameId = formData.get("gameId") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    const result = await joinGame(gameId, name, password);
    
    if (result.success) {
      setJoined(true);
    } else {
      alert(result.error);
    }
    
    setLoading(false);
  };

  if (joined) {
    return (
      <div className="bg-surface-dim text-on-surface min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-zinc-200 p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-lime-100 text-lime-600 rounded-full flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold">وارد شدید!</h2>
          <p className="text-zinc-500">شما با موفقیت به لابی پیوستید. منتظر شروع بازی توسط مدیر باشید...</p>
          <div className="flex gap-2 items-center mt-4 text-lime-600 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
            در انتظار مدیر
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-dim text-on-surface min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-md bg-white rounded-xl shadow-lg border border-zinc-200 p-8 flex flex-col gap-8 relative overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <header className="flex flex-col gap-3 items-center text-center relative z-10">
          <span className="material-symbols-outlined text-4xl text-lime-500 mb-2">login</span>
          <h1 className="text-2xl font-bold">ورود به بازی</h1>
          <p className="text-sm text-zinc-500">برای ورود به بازی، کد و نام خود را وارد کنید</p>
        </header>

        <form onSubmit={handleJoin} className="flex flex-col gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500 px-1">کد بازی</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">tag</span>
              <input name="gameId" required type="text" dir="ltr" placeholder="مثلاً: 123456" className="w-full bg-gray-200 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-colors uppercase font-mono tracking-wider" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500 px-1">نام شما</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">person</span>
              <input name="name" required type="text" placeholder="نامی که سایر بازیکنان می‌بینند" className="w-full bg-gray-200 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500 px-1">رمز عبور (اگر لابی قفل است)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
              <input name="password" type="password" dir="ltr" placeholder="اختیاری" className="w-full bg-gray-200 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-colors" />
            </div>
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-lime-500 text-zinc-950 text-lg font-semibold rounded-lg py-3 mt-4 hover:bg-lime-600 transition-colors shadow-sm disabled:opacity-50">
            {loading ? "در حال ورود..." : "پیوستن به لابی"}
          </button>
        </form>
      </main>
    </div>
  );
}
