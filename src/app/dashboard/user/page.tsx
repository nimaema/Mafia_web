import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AlignmentPieChart from "@/components/charts/AlignmentPieChart";
import WinLossBarChart from "@/components/charts/WinLossBarChart";
import { Alignment } from "@prisma/client";
import { signOut } from "@/auth";

export const metadata = { title: "پنل کاربری" };

const ALIGNMENT_LABELS = {
  CITIZEN: "شهروند",
  MAFIA: "مافیا",
  NEUTRAL: "خنثی",
};

const ALIGNMENT_COLORS = {
  CITIZEN: "#2563eb",
  MAFIA: "#b91c1c",
  NEUTRAL: "#18181b",
};

const RESULT_LABELS = {
  WIN: "برد",
  LOSS: "باخت",
};

export default async function UserDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const sParams = await searchParams;
  const page = parseInt(sParams.page || "1");
  const limit = 5;

  const [totalGames, history, allHistory, waitingGames] = await Promise.all([
    prisma.player.count({ where: { userId: session.user.id, game: { status: "FINISHED" } } }),
    prisma.player.findMany({
      where: { userId: session.user.id, game: { status: "FINISHED" } },
      include: {
        game: { include: { scenario: true } },
        role: true,
      },
      orderBy: { game: { updatedAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.player.findMany({
      where: { userId: session.user.id, game: { status: "FINISHED" } },
      include: { role: true },
    }),
    prisma.game.findMany({
      where: { status: "WAITING" },
      include: { moderator: { select: { name: true } }, scenario: true, _count: { select: { players: true } } },
      take: 3,
    }),
  ]);

  // Transform data for charts
  const alignmentCounts: Record<Alignment, number> = { CITIZEN: 0, MAFIA: 0, NEUTRAL: 0 };
  const scenarioStats: Record<string, { name: string; wins: number; losses: number }> = {};

  for (const h of allHistory) {
    if (h.role?.alignment) alignmentCounts[h.role.alignment]++;
    const sName = h.game.scenario?.name || "سفارشی";
    if (!scenarioStats[sName]) scenarioStats[sName] = { name: sName, wins: 0, losses: 0 };
    // @ts-ignore - Assuming we have a result logic in our actual game state
    if (h.result === "WIN") scenarioStats[sName].wins++;
    // @ts-ignore
    else scenarioStats[sName].losses++;
  }

  const pieData = (Object.entries(alignmentCounts) as [Alignment, number][]).map(
    ([alignment, count]) => ({
      name: ALIGNMENT_LABELS[alignment],
      value: count,
      color: ALIGNMENT_COLORS[alignment],
    })
  );

  const barData = Object.values(scenarioStats).slice(0, 6);
  const totalPages = Math.ceil(totalGames / limit);

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100" dir="rtl">
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-40">
        <div className="page-container flex flex-row-reverse justify-between items-center py-3">
          <span className="text-lg font-bold text-lime-400">🎭 مافیا</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session.user.name}</span>
            <Link href="/lobby" className="text-sm text-zinc-400 hover:text-lime-400 transition-colors">لابی</Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="text-sm text-zinc-500 hover:text-red-400 transition-colors">خروج</button>
            </form>
          </div>
        </div>
      </header>

      <div className="page-container py-8 space-y-8 pb-24 md:pb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold">سلام، {session.user.name} 👋</h1>
          <p className="text-zinc-400 text-sm mt-1">داشبورد بازیکن شما</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          {[
            { label: "کل بازی‌ها", value: totalGames },
            { label: "برد", value: allHistory.filter(h => (h as any).result === "WIN").length },
            { label: "باخت", value: allHistory.filter(h => (h as any).result === "LOSS").length },
            { label: "درصد برد", value: totalGames ? `${Math.round((allHistory.filter(h => (h as any).result === "WIN").length / totalGames) * 100)}٪` : "۰٪" },
          ].map((stat) => (
            <div key={stat.label} className="surface-card p-5">
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <p className="text-2xl font-bold mt-1 text-lime-400">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="surface-card p-6">
            <h2 className="text-base font-semibold mb-4">توزیع نقش‌ها</h2>
            <AlignmentPieChart data={pieData} />
          </div>
          <div className="surface-card p-6">
            <h2 className="text-base font-semibold mb-4">برد/باخت بر اساس سناریو</h2>
            <WinLossBarChart data={barData} />
          </div>
        </div>

        {waitingGames.length > 0 && (
          <div className="surface-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold">بازی‌های در انتظار</h2>
              <Link href="/lobby" className="text-xs text-lime-400 hover:underline">مشاهده همه</Link>
            </div>
            <div className="space-y-3">
              {waitingGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                  <div>
                    <p className="font-medium text-sm">{game.scenario?.name ?? "بازی سفارشی"}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      گرداننده: {game.moderator.name} · {game._count.players} بازیکن
                    </p>
                  </div>
                  <Link href={`/lobby`} className="btn-primary text-xs px-4 py-2">پیوستن</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="surface-card p-6">
          <h2 className="text-base font-semibold mb-4">تاریخچه بازی‌ها</h2>
          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">هنوز بازی‌ای ثبت نشده است</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-right py-3 px-2 text-zinc-400 font-medium">تاریخ</th>
                      <th className="text-right py-3 px-2 text-zinc-400 font-medium">سناریو</th>
                      <th className="text-right py-3 px-2 text-zinc-400 font-medium">نقش</th>
                      <th className="text-right py-3 px-2 text-zinc-400 font-medium">نتیجه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-2 text-zinc-400">
                          {new Date(h.game.updatedAt).toLocaleDateString("fa-IR")}
                        </td>
                        <td className="py-3 px-2">{h.game.scenario?.name ?? "سفارشی"}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            h.role?.alignment === "CITIZEN" ? "chip-citizen" :
                            h.role?.alignment === "MAFIA" ? "chip-mafia" : "chip-neutral"
                          }`}>
                            {h.role?.name || "نامشخص"}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-medium">
                          {(h as any).result === "WIN" ? "برد" : "باخت"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
