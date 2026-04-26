import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col font-sans overflow-hidden" dir="rtl">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[30%] w-[40%] h-[40%] rounded-full bg-lime-500/10 blur-[150px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[180px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-red-500/5 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMDAgMEw0MCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=')] opacity-50"></div>
      </div>

      <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center text-center max-w-2xl gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          <div className="relative">
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-lime-400 to-emerald-600 opacity-20 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                search_off
              </span>
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            مسیر اشتباه است!
          </h2>
          
          <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
            صفحه‌ای که به دنبال آن بودید توسط مافیا از بین رفته است یا اصلاً وجود نداشته. بهتر است قبل از شب شدن به صفحه اصلی برگردید.
          </p>
          
          <div className="mt-8 w-full sm:w-auto">
            <Link href="/" className="relative group overflow-hidden rounded-lg p-[1px] w-full sm:w-auto inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-lg opacity-100 transition-opacity"></span>
              <div className="relative flex items-center justify-center gap-2 bg-zinc-950 px-8 py-4 rounded-lg transition-all group-hover:bg-transparent">
                <span className="text-white font-bold text-lg group-hover:text-zinc-950 transition-colors">بازگشت به خانه</span>
                <span className="material-symbols-outlined text-white text-lg group-hover:text-zinc-950 transition-colors group-hover:translate-x-[4px]">arrow_forward</span>
              </div>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}