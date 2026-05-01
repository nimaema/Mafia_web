import type { Alignment } from "@prisma/client";

type ScenarioRole = {
  id?: string;
  roleId?: string;
  name?: string;
  count: number;
  alignment?: Alignment | string | null;
  role?: {
    id?: string;
    name: string;
    alignment: Alignment | string;
    description?: string | null;
  };
};

type ScenarioRoleCompositionProps = {
  roles: ScenarioRole[];
  compact?: boolean;
};

const groupOrder: Array<Alignment | "UNKNOWN"> = ["CITIZEN", "MAFIA", "NEUTRAL", "UNKNOWN"];

function roleName(item: ScenarioRole) {
  return item.role?.name || item.name || "نقش";
}

function roleAlignment(item: ScenarioRole): Alignment | "UNKNOWN" {
  const alignment = item.role?.alignment || item.alignment;
  if (alignment === "CITIZEN" || alignment === "MAFIA" || alignment === "NEUTRAL") return alignment;
  return "UNKNOWN";
}

function alignmentLabel(alignment: Alignment | "UNKNOWN") {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  if (alignment === "NEUTRAL") return "مستقل";
  return "نامشخص";
}

function alignmentIcon(alignment: Alignment | "UNKNOWN") {
  if (alignment === "CITIZEN") return "verified_user";
  if (alignment === "MAFIA") return "local_police";
  if (alignment === "NEUTRAL") return "casino";
  return "help";
}

function alignmentClass(alignment: Alignment | "UNKNOWN") {
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  if (alignment === "NEUTRAL") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400";
}

function alignmentBar(alignment: Alignment | "UNKNOWN") {
  if (alignment === "CITIZEN") return "bg-sky-500";
  if (alignment === "MAFIA") return "bg-red-500";
  if (alignment === "NEUTRAL") return "bg-amber-500";
  return "bg-zinc-400";
}

function countLabel(count: number) {
  return count > 1 ? `${count} نفر` : "۱ نفر";
}

export function ScenarioRoleComposition({ roles, compact = false }: ScenarioRoleCompositionProps) {
  const grouped = groupOrder
    .map((alignment) => {
      const items = roles.filter((item) => roleAlignment(item) === alignment);
      const total = items.reduce((sum, item) => sum + item.count, 0);
      return { alignment, items, total };
    })
    .filter((group) => group.items.length > 0);

  if (roles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm font-bold text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
        نقشی برای این سناریو ثبت نشده است.
      </div>
    );
  }

  return (
    <div className={compact ? "grid gap-3" : "grid gap-4"}>
      {grouped.map((group) => (
        <section key={group.alignment} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950/60">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-lg border text-lg ${alignmentClass(group.alignment)}`}>
                {alignmentIcon(group.alignment)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-zinc-950 dark:text-white">{alignmentLabel(group.alignment)}</p>
                <p className="mt-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{group.items.length} نوع نقش</p>
              </div>
            </div>
            <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(group.alignment)}`}>
              {group.total} بازیکن
            </span>
          </div>

          <div className={compact ? "grid gap-2 p-2 sm:grid-cols-2" : "grid gap-2 p-3 sm:grid-cols-2"}>
            {group.items.map((item) => {
              const alignment = roleAlignment(item);
              const count = Math.max(1, item.count || 1);
              return (
                <article
                  key={item.roleId || item.id || roleName(item)}
                  className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/70"
                >
                  <span className={`absolute inset-y-3 right-0 w-1 rounded-l-full ${alignmentBar(alignment)}`} />
                  <div className="flex items-start justify-between gap-3 pr-1">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black leading-6 text-zinc-950 dark:text-white">{roleName(item)}</p>
                      <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(alignment)}`}>
                        {alignmentLabel(alignment)}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${alignmentClass(alignment)}`}>
                        {countLabel(count)}
                      </span>
                      {count > 1 && (
                        <div className="mt-2 flex justify-end gap-1">
                          {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
                            <span key={index} className={`size-1.5 rounded-full ${alignmentBar(alignment)}`} />
                          ))}
                          {count > 5 && <span className="text-[9px] font-black text-zinc-400">+{count - 5}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
