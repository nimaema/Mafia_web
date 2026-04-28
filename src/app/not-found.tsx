import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app-page min-h-screen overflow-hidden" dir="rtl">
      <main className="app-container flex min-h-screen items-center py-10">
        <section className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(132,204,22,0.12),transparent_34%),linear-gradient(225deg,rgba(14,165,233,0.10),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(24,24,27,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.045)_1px,transparent_1px)] bg-[size:42px_42px] dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-12">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-lime-500/20 bg-lime-500/10 px-3 py-2 text-sm font-black text-lime-700 dark:text-lime-300">
                <span className="material-symbols-outlined text-lg">radar</span>
                مسیر پیدا نشد
              </div>
              <h1 className="mt-5 text-7xl font-black leading-none text-zinc-950 dark:text-white sm:text-8xl">404</h1>
              <h2 className="mt-4 text-3xl font-black text-zinc-950 dark:text-white">این صفحه از میز بازی حذف شده.</h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-zinc-600 dark:text-zinc-400">
                آدرس درست نیست یا صفحه جابه‌جا شده است. قبل از شروع دور بعدی، از مسیرهای مطمئن برگردید.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/" className="ui-button-primary min-h-12 px-5">
                  <span className="material-symbols-outlined text-xl">home</span>
                  صفحه اصلی
                </Link>
                <Link href="/dashboard/user" className="ui-button-secondary min-h-12 px-5">
                  <span className="material-symbols-outlined text-xl">dashboard</span>
                  داشبورد
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["search_off", "ردیابی", "ناموفق"],
                  ["route", "مسیر", "نامعتبر"],
                  ["shield", "حساب", "امن"],
                  ["login", "بازگشت", "آماده"],
                ].map(([icon, label, value]) => (
                  <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
                    <span className="material-symbols-outlined text-2xl text-lime-600 dark:text-lime-400">{icon}</span>
                    <p className="mt-4 text-xl font-black text-zinc-950 dark:text-white">{value}</p>
                    <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
