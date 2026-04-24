import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col">
      <header className="bg-gray-50/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-row-reverse justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-black text-lime-500 dark:text-lime-400 uppercase">Mafia Role</span>
        </div>
        <Link href="/auth/login" className="bg-lime-400 text-zinc-950 px-6 py-2.5 rounded-xl font-semibold hover:bg-lime-500 hover:-translate-y-[1px] transition-all shadow-sm">
          ورود به بازی
        </Link>
      </header>
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-8 py-16 flex flex-col md:flex-row items-center gap-12 mt-12">
        <div className="flex-1 flex flex-col gap-6 items-start text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold mb-2">
            نسخه ۲.۰ منتشر شد
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            مدیریت <span className="text-lime-400">تحلیلی</span> و <br />
            حرفه‌ای بازی مافیا
          </h1>
          <p className="text-lg text-zinc-400 max-w-lg mt-4">
            با پلتفرم مدیریت Mafia Role، پیچیده‌ترین سناریوها، نقش‌ها و فازهای شب و روز را با دقت و سرعت بالا رهبری کنید. طراحی شده برای گردانندگان حرفه‌ای.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link href="/auth/register" className="bg-lime-400 text-zinc-950 px-8 py-3.5 rounded-xl font-semibold hover:bg-lime-500 hover:-translate-y-[1px] transition-all shadow-sm flex items-center gap-2">
              شروع بازی
            </Link>
            <Link href="/auth/login" className="bg-zinc-800 text-zinc-100 px-8 py-3.5 rounded-xl font-semibold hover:bg-zinc-700 hover:-translate-y-[1px] transition-all border border-zinc-700 flex items-center gap-2">
              ورود گرداننده
            </Link>
          </div>
        </div>
        
        <div className="flex-1 w-full relative h-[500px] hidden md:block">
           <div className="absolute inset-0 bg-gradient-to-tr from-lime-400/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
           <div className="absolute right-0 top-10 w-4/5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">فاز شب - شب دوم</span>
                  </div>
                  <span className="text-xs font-semibold bg-zinc-800 px-3 py-1 rounded-full text-zinc-300">۱۴ بازیکن زنده</span>
               </div>
               <div className="flex flex-col gap-3">
                   <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                       <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></div>
                           <span className="text-sm text-zinc-300">بازیکن شماره ۱ (پدرخوانده)</span>
                       </div>
                   </div>
                   <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                       <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-red-500"></div>
                           <span className="text-sm text-zinc-500 line-through">بازیکن شماره ۴ (شهروند ساده)</span>
                       </div>
                   </div>
               </div>
           </div>
        </div>
      </main>
      
      <footer className="bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row-reverse justify-between items-center w-full px-8 py-12 max-w-7xl mx-auto gap-6 mt-auto">
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Mafia Role</div>
        <div className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
          © ۲۰۲۴ Mafia Role. تمامی حقوق برای مدیریت بازی محفوظ است.
        </div>
      </footer>
    </div>
  );
}
