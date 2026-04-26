import { getAllUserHistory } from "@/actions/dashboard";
import Link from "next/link";

export default async function UserHistoryPage() {
  const history = await getAllUserHistory();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black">تاریخچه بازی‌های من</h1>
        <p className="text-zinc-500">لیست تمامی بازی‌هایی که تاکنون در آن‌ها شرکت کرده‌اید</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-6xl text-zinc-200">history</span>
          <p className="text-zinc-500 font-bold">هنوز هیچ بازی ثبت نشده است.</p>
          <Link href="/dashboard/user" className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl font-bold">
            بازگشت به پیشخوان
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((game: any) => (
            <div key={game.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black">{game.scenarioName}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{game.date} • گرداننده: {game.moderatorName}</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-black ${
                  game.result === 'WIN' ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' : 
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-600 dark:text-red-400'
                }`}>
                  {game.result === 'WIN' ? 'پیروزی' : 'شکست'}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-sm">
                   <span className="material-symbols-outlined text-zinc-400">person</span>
                </div>
                <div>
                   <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">نقش شما</p>
                   <p className="font-black text-lg">{game.roleName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
