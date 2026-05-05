import { getAllUserHistory } from "@/actions/dashboard";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatusChip } from "@/components/CommandUI";

export default async function UserHistoryPage() {
  const history = await getAllUserHistory();

  return (
    <div className="space-y-5">
      <SectionHeader title="بایگانی بازی‌ها" eyebrow="Game Ledger" icon="history" />

      {history.length === 0 ? (
        <EmptyState
          icon="history_toggle_off"
          title="هنوز بازی ثبت نشده"
          text="بعد از پایان اولین بازی، خلاصه و نقش‌ها اینجا ذخیره می‌شود."
          action={<CommandButton href="/dashboard/user">بازگشت به خانه</CommandButton>}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {history.map((game: any) => (
            <CommandSurface key={game.id} interactive className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-zinc-50">{game.scenarioName}</h2>
                  <p className="mt-1 truncate text-xs text-zinc-400">{game.date} · گرداننده: {game.moderatorName}</p>
                </div>
                <StatusChip tone={game.result === "WIN" ? "emerald" : "rose"}>
                  {game.result === "WIN" ? "پیروزی" : "شکست"}
                </StatusChip>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[10px] font-black text-zinc-500">نقش شما</p>
                  <p className="mt-1 truncate font-black text-zinc-100">{game.roleName}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[10px] font-black text-zinc-500">بازیکنان</p>
                  <p className="mt-1 font-black text-cyan-100">{game.players?.length || 0}</p>
                </div>
              </div>
            </CommandSurface>
          ))}
        </div>
      )}
    </div>
  );
}
