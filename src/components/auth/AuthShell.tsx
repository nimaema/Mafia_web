import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type AuthShellProps = {
  icon: string;
  title: string;
  subtitle: string;
  activeTab?: "login" | "register";
  children: ReactNode;
  footer?: ReactNode;
};

const highlights = [
  {
    icon: "dashboard",
    title: "داشبورد یکپارچه",
    text: "ورود بازیکن، گرداننده و مدیر در یک تجربه هماهنگ جمع شده است.",
  },
  {
    icon: "account_tree",
    title: "سناریوهای دقیق",
    text: "ترکیب نقش‌ها، ظرفیت‌ها و روند لابی‌ها مرتب و قابل پیگیری می‌ماند.",
  },
  {
    icon: "install_mobile",
    title: "آماده برای موبایل",
    text: "نسخه وب‌اپ، تم روشن و تاریک، و ناوبری سریع برای استفاده روزمره.",
  },
];

export function AuthShell({ icon, title, subtitle, activeTab, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-[#0e0e0e] text-zinc-900 dark:text-[#e5e2e1] font-sans selection:bg-[#ffb4ab] dark:selection:bg-[#98000b] selection:text-zinc-950 dark:selection:text-white transition-colors duration-300 relative overflow-hidden" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 dark:bg-[#98000b]/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[150px] opacity-70 animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[60%] bg-red-400/5 dark:bg-[#ffb4ab]/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-50" />
      </div>

      <header className="relative z-40 max-w-7xl mx-auto w-full px-4 md:px-8 flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-white dark:bg-[#131313] border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:border-red-400 dark:group-hover:border-[#ffb4ab]/50 transition-colors duration-300">
            <span className="material-symbols-outlined text-2xl text-red-600 dark:text-[#ffb4ab]">casino</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider text-zinc-950 dark:text-white transition-colors">MAFIA<span className="text-red-600 dark:text-[#ffb4ab]">COMPANION</span></h1>
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">Authentication Area</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/" className="hidden sm:flex items-center gap-2 h-10 px-5 bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 hover:border-red-400 dark:hover:border-[#ffb4ab]/50 text-zinc-900 dark:text-white font-bold text-xs tracking-wide transition-all duration-300">
            <span className="material-symbols-outlined text-base">home</span>
            <span>بازگشت به خانه</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-[1100px] grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          
          <section className="hidden lg:flex flex-col gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#131313] border border-zinc-200 dark:border-white/10 rounded-full transition-colors duration-300">
                <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-[#ffb4ab] animate-pulse" />
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">Secure Gateway</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl xl:text-5xl font-black leading-[1.1] text-zinc-950 dark:text-white tracking-tight">
                  کنترل کامل لابی‌ها و جریان بازی،
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-600 dark:from-[#ffb4ab] to-red-900 dark:to-[#98000b] block mt-2">تنها با یک کلیک</span>
                </h2>
                <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  فرقی نمی‌کند بازیکن، گرداننده یا مدیر باشید؛ مافیا کمپانیون به شما این قدرت را می‌دهد که با حداکثر سرعت در روند بازی سهیم باشید.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {highlights.map((item) => (
                <div key={item.title} className="bg-white dark:bg-[#131313] border border-zinc-200 dark:border-white/5 p-5 group hover:border-red-300 dark:hover:border-[#ffb4ab]/30 transition-all duration-300">
                  <span className="material-symbols-outlined text-xl text-red-600 dark:text-[#ffb4ab] mb-3 group-hover:scale-110 transition-transform origin-right">{item.icon}</span>
                  <h3 className="font-black text-zinc-950 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="w-full max-w-md mx-auto bg-white/80 dark:bg-[#131313]/90 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-8 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 transition-colors duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 dark:from-[#98000b] to-red-400 dark:to-[#ffb4ab]" />
            
            <header className="flex flex-col items-center gap-4 text-center mb-10">
              <div className="flex size-16 items-center justify-center bg-red-50 dark:bg-[#0e0e0e] text-red-600 dark:text-[#ffb4ab] border border-red-200 dark:border-white/10 group-hover:border-red-400 dark:group-hover:border-[#ffb4ab]/50 transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>
              </div>
            </header>

            {activeTab && (
              <div className="mb-8 grid grid-cols-2 gap-1 border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0e0e0e] p-1 relative transition-colors duration-300">
                {activeTab === "login" ? (
                  <>
                    <button className="bg-red-600 dark:bg-white/10 px-4 py-3 text-sm font-black text-white shadow-sm border border-transparent dark:border-white/10 transition-colors">
                      ورود
                    </button>
                    <Link href="/auth/register" className="flex items-center justify-center px-4 py-3 text-center text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                      ثبت نام
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="flex items-center justify-center px-4 py-3 text-center text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                      ورود
                    </Link>
                    <button className="bg-red-600 dark:bg-white/10 px-4 py-3 text-sm font-black text-white shadow-sm border border-transparent dark:border-white/10 transition-colors">
                      ثبت نام
                    </button>
                  </>
                )}
              </div>
            )}

            <div>{children}</div>

            {footer && <div className="mt-6">{footer}</div>}
          </section>

        </div>
      </main>
    </div>
  );
}
