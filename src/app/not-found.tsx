import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pm-app-bg grid min-h-screen place-items-center px-4 text-zinc-100" dir="rtl">
      <main className="pm-surface w-full max-w-lg p-6 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] border border-rose-300/20 bg-rose-400/10">
          <span className="material-symbols-outlined text-5xl text-rose-100">travel_explore</span>
        </div>
        <p className="mt-5 font-mono text-6xl font-black text-cyan-100/20">404</p>
        <h1 className="mt-2 text-2xl font-black text-zinc-50">این مسیر در سناریو نیست</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-zinc-400">
          صفحه پیدا نشد. بهتر است قبل از شروع شب به خانه برگردید.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950">
          بازگشت به خانه
        </Link>
      </main>
    </div>
  );
}
