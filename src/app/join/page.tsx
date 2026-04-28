"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { joinGame } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";

export default function JoinGamePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const { showAlert } = usePopup();

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const gameId = String(formData.get("gameId") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const password = String(formData.get("password") || "").trim();
    if (!gameId || !name) {
      showAlert("فرم ناقص است", "کد بازی و نام نمایشی حساب را کامل وارد کنید.", "warning");
      setLoading(false);
      return;
    }

    try {
      const result = await joinGame(gameId, name, password);

      if (result.success) {
        router.push(`/lobby/${result.gameId}`);
      } else {
        showAlert("خطا", result.error || "خطا در پیوستن به بازی", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("خطا", "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page min-h-screen p-4" dir="rtl">
      <main className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="ui-muted inline-flex items-center gap-2 px-3 py-2">
              <span className="material-symbols-outlined text-base text-lime-600 dark:text-lime-400">login</span>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">ورود بازیکن ثبت‌نام‌شده</span>
            </div>
            <h1 className="mt-5 text-5xl font-black leading-tight text-zinc-950 dark:text-white">کد بازی را وارد کنید و مستقیم به لابی بروید.</h1>
            <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
              فقط کاربران ثبت‌نام‌شده می‌توانند وارد بازی شوند. نام حساب شما در فهرست بازیکنان لابی دیده می‌شود.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["tag", "کد شش رقمی"],
                ["verified_user", "حساب کاربری"],
                ["lock", "رمز در صورت نیاز"],
              ].map(([icon, text]) => (
                <div key={text} className="ui-muted p-4">
                  <span className="material-symbols-outlined text-xl text-lime-600 dark:text-lime-400">{icon}</span>
                  <p className="mt-3 text-sm font-black text-zinc-950 dark:text-white">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ui-card w-full overflow-hidden">
          <header className="border-b border-zinc-200 bg-zinc-50/80 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mx-auto flex size-16 items-center justify-center rounded-lg bg-lime-500 text-zinc-950">
              <span className="material-symbols-outlined text-3xl">stadia_controller</span>
            </div>
            <h2 className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">پیوستن به بازی</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {session?.user?.name ? `${session.user.name}، کد لابی و رمز اختیاری را وارد کنید.` : "کد لابی و رمز اختیاری را وارد کنید."}
            </p>
          </header>

          <form onSubmit={handleJoin} noValidate className="space-y-4 p-6">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">کد بازی</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">tag</span>
                <input
                  name="gameId"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="123456"
                  className="w-full pl-12 font-mono text-lg font-black"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">نام نمایشی حساب</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">person</span>
                <input
                  name="name"
                  type="text"
                  defaultValue={session?.user?.name || ""}
                  placeholder="نامی که سایر بازیکنان می‌بینند"
                  className="w-full pl-12"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">رمز عبور</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
                <input
                  name="password"
                  type="password"
                  dir="ltr"
                  placeholder="اگر لابی خصوصی است"
                  className="w-full pl-12"
                />
              </div>
            </label>

            <button disabled={loading} type="submit" className="ui-button-primary min-h-12 w-full text-base">
              <span className={`material-symbols-outlined text-xl ${loading ? "animate-spin" : ""}`}>
                {loading ? "refresh" : "login"}
              </span>
              {loading ? "در حال ورود..." : "پیوستن به لابی"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
