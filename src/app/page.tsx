import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard/user");
  }

  const features = [
    { icon: "theater_comedy", title: "نقش‌های تصادفی", text: "تخصیص کاملاً تصادفی و مخفی نقش‌ها به بازیکنان بر اساس سناریو." },
    { icon: "account_tree", title: "مدیریت سناریوها", text: "پشتیبانی از سناریوهای متنوع با ترکیب‌های مختلف از جبهه‌ها." },
    { icon: "gavel", title: "پنل گردانندگی", text: "کنترل کامل بازی با امکان ثبت گزارش و پیگیری رویدادهای هر شب و روز." },
    { icon: "history", title: "تاریخچه بازی‌ها", text: "ثبت نتایج، تیم‌های برنده و نقش هر بازیکن در تاریخچه سیستم." },
    { icon: "sports_esports", title: "لابی زنده", text: "امکان پیوستن به لابی‌ها با کد اختصاصی و تشکیل بازی سریع." },
    { icon: "public", title: "گزارش عمومی", text: "انتشار خودکار گزارش کامل بازی پس از اتمام برای همه بازیکنان." },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0e0e0e] text-zinc-900 dark:text-[#e5e2e1] font-sans selection:bg-[#ffb4ab] dark:selection:bg-[#98000b] selection:text-zinc-950 dark:selection:text-white transition-colors duration-300" dir="rtl">
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-red-500/10 dark:bg-[#98000b]/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[150px] opacity-70 animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-red-400/5 dark:bg-[#ffb4ab]/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0e0e0e]/80 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-[#131313] border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 transition-colors duration-300">
                <span className="material-symbols-outlined text-red-600 dark:text-[#ffb4ab]">casino</span>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wider text-zinc-950 dark:text-white transition-colors duration-300">MAFIA<span className="text-red-600 dark:text-[#ffb4ab]">COMPANION</span></h1>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">System V.1</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/auth/login" className="hidden md:flex items-center gap-2 h-10 px-6 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 hover:border-red-400 dark:hover:border-[#ffb4ab]/50 text-zinc-900 dark:text-white font-bold text-sm tracking-wide transition-all duration-300">
                <span className="material-symbols-outlined text-lg">login</span>
                <span>ورود به سیستم</span>
              </Link>
            </div>
          </div>
          {/* Progress bar accent */}
          <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-red-500 dark:via-[#98000b] to-transparent opacity-50" />
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 md:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#131313] border border-zinc-200 dark:border-white/10 rounded-full mb-8 transition-colors duration-300">
            <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-[#ffb4ab] animate-pulse" />
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">Live Platform</span>
          </div>

          <h2 className="text-5xl md:text-8xl font-black text-zinc-950 dark:text-white tracking-tight mb-6 leading-tight transition-colors duration-300">
            دستیار هوشمند <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-600 dark:from-[#ffb4ab] to-red-900 dark:to-[#98000b]">بازی مافیا</span>
          </h2>
          
          <p className="max-w-2xl text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-12 leading-relaxed transition-colors duration-300">
            سیستم یکپارچه مدیریت بازی، انتخاب سناریو، تخصیص نقش‌ها و ثبت گزارشات برای یک تجربه حرفه‌ای از بازی مافیا.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/auth/register" 
              className="group relative flex items-center justify-center gap-3 w-full sm:w-auto h-14 px-8 bg-red-700 dark:bg-[#98000b] text-white font-black text-lg tracking-wide overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] dark:hover:shadow-[0_0_30px_rgba(152,0,11,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="material-symbols-outlined relative z-10 text-2xl group-hover:scale-110 transition-transform">rocket_launch</span>
              <span className="relative z-10">شروع بازی</span>
            </Link>
            <Link 
              href="/auth/login" 
              className="flex items-center justify-center gap-3 w-full sm:w-auto h-14 px-8 bg-white dark:bg-[#131313] border border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/30 text-zinc-900 dark:text-white font-bold text-base tracking-wide transition-all duration-300"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              <span>ورود به حساب</span>
            </Link>
          </div>
        </main>

        {/* Features Grid */}
        <section className="py-24 px-4 md:px-8 border-t border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-[#0a0a0a]/50 relative z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center">
              <h3 className="text-3xl md:text-5xl font-black text-zinc-950 dark:text-white mb-4 transition-colors duration-300">امکانات سیستم</h3>
              <div className="h-1 w-24 bg-red-600 dark:bg-[#98000b] mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="group relative bg-white dark:bg-[#131313] border border-zinc-200 dark:border-white/5 p-8 hover:border-red-300 dark:hover:border-[#ffb4ab]/30 transition-all duration-500 shadow-sm hover:shadow-md dark:shadow-none">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 dark:from-[#98000b] to-red-400 dark:to-[#ffb4ab] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-[#0e0e0e] border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-6 group-hover:border-red-300 dark:group-hover:border-[#ffb4ab]/50 group-hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] dark:group-hover:shadow-[0_0_15px_rgba(255,180,171,0.2)] transition-all duration-300">
                    <span className="material-symbols-outlined text-2xl text-zinc-400 group-hover:text-red-600 dark:group-hover:text-[#ffb4ab] transition-colors">{feature.icon}</span>
                  </div>
                  
                  <h4 className="text-xl font-black text-zinc-950 dark:text-white mb-3 transition-colors duration-300">{feature.title}</h4>
                  <p className="text-zinc-600 dark:text-zinc-500 leading-relaxed text-sm transition-colors duration-300">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#0e0e0e] relative z-10 transition-colors duration-300">
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-600 tracking-widest uppercase">
            © {new Date().getFullYear()} MAFIA COMPANION. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </div>
    </div>
  );
}
