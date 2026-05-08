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
  if (alignment === "CITIZEN") return "border-sky-400/22 bg-sky-400/10 text-sky-300";
  if (alignment === "MAFIA") return "border-rose-400/24 bg-rose-400/10 text-rose-300";
  if (alignment === "NEUTRAL") return "border-amber-400/24 bg-amber-400/10 text-amber-300";
  return "border-[var(--pm-line)] bg-white/[0.055] text-white/50";
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
      <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.045] p-6 text-center text-sm font-bold text-white/52">
        نقشی برای این سناریو ثبت نشده است.
      </div>
    );
  }

  return (
    <div className={compact ? "grid gap-3" : "grid gap-4"}>
      {grouped.map((group) => (
        <section key={group.alignment} className="overflow-hidden rounded-2xl border border-[var(--pm-line)] bg-white/[0.045] shadow-lg shadow-black/10 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--pm-line)] bg-black/18 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-xl border text-lg ${alignmentClass(group.alignment)}`}>
                {alignmentIcon(group.alignment)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-white">{alignmentLabel(group.alignment)}</p>
                <p className="mt-0.5 text-[10px] font-bold text-white/42">{group.items.length} نوع نقش</p>
              </div>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${alignmentClass(group.alignment)}`}>
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
                  className="motion-surface relative overflow-hidden rounded-2xl border border-[var(--pm-line)] bg-[#15171b]/72 p-3 shadow-sm shadow-black/10"
                >
                  <span className={`absolute inset-y-3 right-0 w-1 rounded-l-full ${alignmentBar(alignment)}`} />
                  <div className="flex items-start justify-between gap-3 pr-1">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black leading-6 text-white">{roleName(item)}</p>
                      <p className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${alignmentClass(alignment)}`}>
                        {alignmentLabel(alignment)}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${alignmentClass(alignment)}`}>
                        {countLabel(count)}
                      </span>
                      {count > 1 && (
                        <div className="mt-2 flex justify-end gap-1">
                          {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
                            <span key={index} className={`size-1.5 rounded-full ${alignmentBar(alignment)}`} />
                          ))}
                          {count > 5 && <span className="text-[9px] font-black text-white/42">+{count - 5}</span>}
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
