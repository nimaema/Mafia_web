"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col font-sans overflow-hidden" dir="rtl">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-lime-500/10 blur-[150px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[180px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMDAgMEw0MCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=')] opacity-50"></div>
      </div>

      <header className="relative z-50 flex justify-between items-center w-full px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-600 p-[1px] shadow-lg shadow-lime-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-xl bg-gradient-to-br from-lime-400 to-emerald-500 bg-clip-text text-transparent">domino_mask</span>
            </div>
          </div>
          <span className="text-xl font-black text-white tracking-wider">MAFIA</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/auth/register" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">ثبت‌نام</Link>
          <Link href="/auth/login" className="relative group overflow-hidden rounded-xl p-[1px]">
            <span className="absolute inset-0 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"></span>
            <div className="relative flex items-center justify-center gap-2 bg-zinc-900 px-5 py-2.5 rounded-xl transition-all group-hover:bg-transparent">
              <span className="text-white font-bold text-sm tracking-wide group-hover:text-zinc-950 transition-colors">ورود</span>
            </div>
          </Link>
        </div>
      </header>
      
      <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center min-h-[80vh]">
        
        <div className="flex flex-col items-center text-center max-w-3xl gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-zinc-300">نسخه جدید پلتفرم منتشر شد</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tight">
            مافیا را <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">حرفه‌ای</span> <br className="hidden sm:block" /> تجربه کنید
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
            سیستم هوشمند مدیریت بازی، ساخت لابی اختصاصی، پیشنهاد خودکار سناریوها و توزیع مخفی نقش‌ها.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
            <Link href="/auth/register" className="relative group overflow-hidden rounded-2xl p-[1px] w-full sm:w-auto">
              <span className="absolute inset-0 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-2xl opacity-100 transition-opacity"></span>
              <div className="relative flex items-center justify-center gap-2 bg-lime-500/10 backdrop-blur-md px-8 py-4 rounded-2xl transition-all group-hover:bg-transparent">
                <span className="text-white font-bold text-lg tracking-wide group-hover:text-zinc-950 transition-colors">شروع بازی</span>
                <span className="material-symbols-outlined text-white text-lg group-hover:text-zinc-950 transition-colors group-hover:translate-x-[-4px]">arrow_back</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Floating Cards Demo */}
        <div className="w-full max-w-4xl mt-24 relative h-64 sm:h-48 pointer-events-none hidden md:block">
           <div className="absolute top-0 right-[15%] w-64 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl transform rotate-3 animate-[float_6s_ease-in-out_infinite]">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-sm font-bold text-white">بازپرس ویژه</span>
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">شهروند</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                 <div className="w-3/4 h-full bg-lime-500"></div>
              </div>
              <p className="text-[10px] text-zinc-500">قابلیت بررسی مظنونین</p>
           </div>
           
           <div className="absolute top-12 left-[15%] w-64 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl transform -rotate-3 animate-[float_8s_ease-in-out_infinite_reverse]">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-sm font-bold text-white">پدرخوانده</span>
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20">مافیا</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs text-white">?</div>
                 <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs text-white">?</div>
                 <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs text-white">?</div>
              </div>
           </div>
           
           <div className="absolute -top-8 left-[40%] w-72 bg-zinc-900/80 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(132,204,22,0.15)] transform z-10 animate-[float_7s_ease-in-out_infinite]">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-lime-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lime-400">group</span>
                 </div>
                 <div>
                    <h3 className="text-white font-bold">لابی شماره #402</h3>
                    <p className="text-xs text-lime-400">در حال عضوگیری (8/12)</p>
                 </div>
              </div>
              <div className="flex -space-x-2 space-x-reverse">
                 {[1,2,3,4,5].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-400">U{i}</div>
                 ))}
                 <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white">+3</div>
              </div>
           </div>
        </div>
      </main>
      
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(var(--tw-rotate)); }
          50% { transform: translateY(-15px) rotate(var(--tw-rotate)); }
          100% { transform: translateY(0px) rotate(var(--tw-rotate)); }
        }
      `}</style>
    </div>
  );
}
