import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-page pm-force-dark flex min-h-screen items-center overflow-hidden bg-[#15171b] px-4 py-10 text-white" dir="rtl">
      <section className="app-container">
        <div className="pm-command pm-aurora mx-auto grid max-w-5xl gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative z-10 flex flex-col justify-center">
            <div className="pm-chip pm-chip-warning w-fit">
              <span className="material-symbols-outlined text-base">radar</span>
              مسیر پیدا نشد
            </div>
            <h1 className="mt-5 text-7xl font-black leading-none sm:text-8xl">404</h1>
            <h2 className="mt-4 text-3xl font-black">این صفحه از میز بازی خارج شده.</h2>
            <p className="mt-4 max-w-xl text-base font-bold leading-8 text-white/58">
              آدرس درست نیست یا صفحه جابه‌جا شده است. قبل از شروع دور بعدی، از مسیرهای امن برگردید.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/" className="pm-button pm-button-primary min-h-12 px-5">
                <span className="material-symbols-outlined text-xl">home</span>
                صفحه اصلی
              </Link>
              <Link href="/dashboard/user" className="pm-button pm-button-secondary min-h-12 bg-white/[0.07] px-5 text-white shadow-none">
                <span className="material-symbols-outlined text-xl">dashboard</span>
                داشبورد
              </Link>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3">
            {[
              ["search_off", "ردیابی", "ناموفق"],
              ["route", "مسیر", "نامعتبر"],
              ["shield", "حساب", "امن"],
              ["login", "بازگشت", "آماده"],
            ].map(([icon, label, value]) => (
              <div key={label} className="pm-muted-card p-4">
                <span className="material-symbols-outlined text-2xl text-cyan-200">{icon}</span>
                <p className="mt-4 text-xl font-black">{value}</p>
                <p className="mt-1 text-xs font-bold text-white/48">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
