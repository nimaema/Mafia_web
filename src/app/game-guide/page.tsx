import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TEMP_SCENARIO_DESCRIPTION_PREFIX } from "@/lib/gameDisplay";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "راهنمای بازی مافیا | مافیا بورد",
  description: "راهنمای خوانای نقش‌ها، سناریوها، توانایی‌های شب و ترکیب‌های بازی در مافیا بورد.",
  alternates: {
    canonical: "/game-guide",
  },
  openGraph: {
    title: "راهنمای بازی مافیا | مافیا بورد",
    description: "راهنمای خوانای نقش‌ها، سناریوها، توانایی‌های شب و ترکیب‌های بازی.",
    url: "/game-guide",
    locale: "fa_IR",
    type: "article",
  },
};

const flowSteps = [
  ["login", "ورود"],
  ["groups", "لابی"],
  ["dark_mode", "شب"],
  ["how_to_vote", "رای‌گیری"],
  ["summarize", "گزارش"],
];

const alignments = ["CITIZEN", "MAFIA", "NEUTRAL"] as const;
type GuideAlignment = (typeof alignments)[number];

type RoleNightAbilityChoice = {
  id: string;
  label: string;
  usesPerGame?: number | null;
  effectType?: string | null;
};

type RoleNightAbility = {
  id: string;
  label: string;
  usesPerGame?: number | null;
  usesPerNight?: number | null;
  targetsPerUse?: number | null;
  selfTargetLimit?: number | null;
  effectType?: string | null;
  choices: RoleNightAbilityChoice[];
};

function alignmentLabel(alignment?: string | null) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment?: string | null) {
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function alignmentIcon(alignment?: string | null) {
  if (alignment === "CITIZEN") return "verified_user";
  if (alignment === "MAFIA") return "local_police";
  return "casino";
}

function alignmentOrder(alignment?: string | null) {
  if (alignment === "CITIZEN") return 0;
  if (alignment === "MAFIA") return 1;
  return 2;
}

function roleCountLabel(count: number) {
  return count > 1 ? `${count} نفر` : "۱ نفر";
}

function normalizeRoleAbilities(value: unknown): RoleNightAbility[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((ability, index) => {
      const record = ability as Partial<RoleNightAbility>;
      const label = String(record.label || "").trim();
      if (!label) return null;

      return {
        id: String(record.id || `ability-${index + 1}`),
        label,
        usesPerGame: typeof record.usesPerGame === "number" ? record.usesPerGame : null,
        usesPerNight: typeof record.usesPerNight === "number" ? record.usesPerNight : null,
        targetsPerUse: typeof record.targetsPerUse === "number" ? Math.max(1, Math.min(5, record.targetsPerUse)) : 1,
        selfTargetLimit: typeof record.selfTargetLimit === "number" ? Math.max(0, Math.min(5, record.selfTargetLimit)) : 0,
        effectType: typeof record.effectType === "string" ? record.effectType : "NONE",
        choices: Array.isArray(record.choices)
          ? record.choices
              .map((choice, choiceIndex) => {
                const choiceRecord = choice as Partial<RoleNightAbilityChoice>;
                const choiceLabel = String(choiceRecord.label || "").trim();
                if (!choiceLabel) return null;
                return {
                  id: String(choiceRecord.id || `choice-${choiceIndex + 1}`),
                  label: choiceLabel,
                  usesPerGame: typeof choiceRecord.usesPerGame === "number" ? choiceRecord.usesPerGame : null,
                  effectType: typeof choiceRecord.effectType === "string" ? choiceRecord.effectType : "NONE",
                };
              })
              .filter(Boolean) as RoleNightAbilityChoice[]
          : [],
      };
    })
    .filter(Boolean) as RoleNightAbility[];
}

function nightLimitLabel(value?: number | null) {
  return value ? `فقط ${value} شب در کل بازی` : "قابل استفاده در هر شب";
}

function effectLabel(effectType?: string | null) {
  if (effectType === "CONVERT_TO_MAFIA") return "تبدیل به مافیا";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "استعلام دو اسمی";
  return "اثر ویژه ندارد";
}

function abilityUsageLabel(ability: RoleNightAbility) {
  const targetCount = ability.targetsPerUse || 1;
  const selfLimit = ability.selfTargetLimit ?? 0;
  const parts = [nightLimitLabel(ability.usesPerGame)];
  parts.push(targetCount > 1 ? `هر ثبت شامل ${targetCount} هدف/گزینه` : "هر ثبت روی ۱ هدف");
  parts.push(selfLimit > 0 ? `روی خودش تا ${selfLimit} بار` : "روی خودش مجاز نیست");
  if (ability.choices.length) parts.push(`${ability.choices.length} گزینه هدف`);
  return parts.join("، ");
}

function sortRoles<T extends { name: string; alignment?: string | null }>(roles: T[]) {
  return roles
    .slice()
    .sort((left, right) => alignmentOrder(left.alignment) - alignmentOrder(right.alignment) || left.name.localeCompare(right.name, "fa"));
}

function scenarioTotalPlayers(scenario: { roles: { count: number }[] }) {
  return scenario.roles.reduce((sum, item) => sum + item.count, 0);
}

function scenarioAlignmentCounts(scenario: { roles: { count: number; role: { alignment?: string | null } }[] }) {
  return scenario.roles.reduce(
    (counts, item) => {
      const key = (item.role.alignment || "NEUTRAL") as GuideAlignment;
      counts[key] += item.count;
      return counts;
    },
    { CITIZEN: 0, MAFIA: 0, NEUTRAL: 0 } as Record<GuideAlignment, number>
  );
}

async function getGuideLibrary() {
  try {
    const [roles, scenarios] = await Promise.all([
      prisma.mafiaRole.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          alignment: true,
          nightAbilities: true,
        },
      }),
      prisma.scenario.findMany({
        where: {
          NOT: [
            { description: { startsWith: TEMP_SCENARIO_DESCRIPTION_PREFIX } },
            { description: "سناریو ساخته شده در لحظه" },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          roles: {
            select: {
              count: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  alignment: true,
                  description: true,
                  nightAbilities: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return { roles: sortRoles(roles), scenarios, unavailable: false };
  } catch {
    return { roles: [], scenarios: [], unavailable: true };
  }
}

function RoleAbilityList({ abilities }: { abilities: RoleNightAbility[] }) {
  if (!abilities.length) return null;

  return (
    <div className="mt-4 border-t border-[var(--pm-line)] pt-4">
      <p className="text-[11px] font-black text-[var(--pm-primary)]">توانایی شب</p>
      <div className="mt-2 grid gap-2">
        {abilities.map((ability) => (
          <div key={ability.id} className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-[var(--pm-text)]">{ability.label}</span>
              <span className="rounded-[var(--radius-full)] border border-[var(--pm-line)] px-2 py-0.5 text-[10px] font-black text-[var(--pm-muted)]">
                {effectLabel(ability.effectType)}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold leading-6 text-[var(--pm-muted)]">{abilityUsageLabel(ability)}</p>
            {ability.choices.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ability.choices.map((choice) => (
                  <span key={choice.id} className="rounded-[var(--radius-full)] border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2 py-0.5 text-[10px] font-black text-[var(--pm-primary)]">
                    {choice.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function GameGuidePage() {
  const { roles, scenarios, unavailable } = await getGuideLibrary();
  const roleGroups = alignments
    .map((alignment) => ({
      alignment,
      roles: roles.filter((role) => role.alignment === alignment),
    }))
    .filter((group) => group.roles.length > 0);
  const largestScenario = scenarios.reduce((max, scenario) => Math.max(max, scenarioTotalPlayers(scenario)), 0);

  return (
    <main className="app-page min-h-screen text-[var(--pm-text)]" dir="rtl">
      <header className="app-container relative z-10 flex items-center justify-between gap-3 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="pm-icon-primary">
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black">مافیا بورد</p>
            <p className="text-[11px] font-black text-cyan-700 dark:text-[var(--pm-primary)]">راهنمای بازی</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/dashboard/user" className="pm-button pm-button-secondary min-h-10 px-3 text-xs sm:px-4 sm:text-sm">
            داشبورد
            <span className="material-symbols-outlined text-lg">dashboard</span>
          </Link>
        </div>
      </header>

      <section className="app-container pb-8">
        <div className="pm-card overflow-hidden p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="pm-chip pm-chip-primary">
                <span className="material-symbols-outlined text-base">menu_book</span>
                راهنمای خواندن نقش‌ها و سناریوها
              </div>
              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
                نقش‌ها و سناریوها، کامل و بدون برش متن.
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[var(--pm-muted)] sm:text-base">
                این صفحه برای خواندن جزئیات است؛ توضیح نقش‌ها، توانایی‌های شب و ترکیب سناریوها در کارت‌های بزرگ نمایش داده می‌شود.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[24rem]">
              <div className="pm-muted-card p-3 text-center">
                <p className="text-2xl font-black text-[var(--pm-primary)]">{roles.length}</p>
                <p className="mt-1 text-[10px] font-black text-[var(--pm-muted)]">نقش</p>
              </div>
              <div className="pm-muted-card p-3 text-center">
                <p className="text-2xl font-black text-violet-600 dark:text-violet-300">{scenarios.length}</p>
                <p className="mt-1 text-[10px] font-black text-[var(--pm-muted)]">سناریو</p>
              </div>
              <div className="pm-muted-card p-3 text-center">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300">{largestScenario}</p>
                <p className="mt-1 text-[10px] font-black text-[var(--pm-muted)]">ظرفیت</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#roles" className="pm-button pm-button-primary min-h-10 px-4 text-sm">
              نقش‌ها
              <span className="material-symbols-outlined text-lg">theater_comedy</span>
            </a>
            <a href="#scenarios" className="pm-button pm-button-secondary min-h-10 px-4 text-sm">
              سناریوها
              <span className="material-symbols-outlined text-lg">account_tree</span>
            </a>
            <div className="flex flex-wrap gap-1.5">
              {flowSteps.map(([icon, label]) => (
                <span key={label} className="pm-chip">
                  <span className="material-symbols-outlined text-sm">{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {unavailable && (
        <section className="app-container pb-8">
          <div className="rounded-[var(--radius-sm)] border border-amber-500/25 bg-amber-500/10 p-4 text-sm font-bold leading-7 text-amber-700 dark:text-amber-300">
            کتابخانه نقش‌ها و سناریوها فعلاً قابل بارگذاری نیست. بعد از اتصال دیتابیس، همین بخش به‌صورت خودکار از اطلاعات فعلی سایت پر می‌شود.
          </div>
        </section>
      )}

      <section id="roles" className="app-container scroll-mt-6 pb-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black text-[var(--pm-primary)]">کتابخانه نقش‌ها</p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">همه نقش‌ها با توضیح کامل</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {roleGroups.map((group) => (
              <span key={group.alignment} className={`rounded-[var(--radius-full)] border px-3 py-1 text-xs font-black ${alignmentClass(group.alignment)}`}>
                {alignmentLabel(group.alignment)}: {group.roles.length}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          {roleGroups.length === 0 ? (
            <div className="pm-card p-8 text-center text-sm font-bold text-[var(--pm-muted)]">نقشی برای نمایش پیدا نشد.</div>
          ) : (
            roleGroups.map((group) => (
              <section key={group.alignment} className="pm-card overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pm-line)] p-4">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined grid size-11 place-items-center rounded-[var(--radius-sm)] border text-xl ${alignmentClass(group.alignment)}`}>
                      {alignmentIcon(group.alignment)}
                    </span>
                    <div>
                      <h3 className="text-xl font-black">{alignmentLabel(group.alignment)}</h3>
                      <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">{group.roles.length} نقش در این جبهه</p>
                    </div>
                  </div>
                </header>

                <div className="grid gap-3 p-4 lg:grid-cols-2">
                  {group.roles.map((role) => {
                    const abilities = normalizeRoleAbilities(role.nightAbilities);

                    return (
                      <article key={role.id} className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h4 className="break-words text-lg font-black leading-7">{role.name}</h4>
                          <span className={`shrink-0 rounded-[var(--radius-full)] border px-2.5 py-1 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                            {alignmentLabel(role.alignment)}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm font-bold leading-8 text-[var(--pm-muted)]">
                          {role.description || "توضیحی برای این نقش ثبت نشده است."}
                        </p>
                        <RoleAbilityList abilities={abilities} />
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </section>

      <section id="scenarios" className="app-container scroll-mt-6 pb-16">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black text-violet-600 dark:text-violet-300">کتابخانه سناریوها</p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">ترکیب سناریوها با جزئیات نقش‌ها</h2>
          </div>
          <span className="pm-chip">{scenarios.length} سناریو</span>
        </div>

        <div className="grid gap-5">
          {scenarios.length === 0 ? (
            <div className="pm-card p-8 text-center text-sm font-bold text-[var(--pm-muted)]">سناریویی برای نمایش پیدا نشد.</div>
          ) : (
            scenarios.map((scenario) => {
              const totalPlayers = scenarioTotalPlayers(scenario);
              const counts = scenarioAlignmentCounts(scenario);
              const scenarioRoles = sortRoles(
                scenario.roles.map((item) => ({
                  ...item.role,
                  count: item.count,
                }))
              );

              return (
                <article key={scenario.id} className="pm-card overflow-hidden">
                  <header className="border-b border-[var(--pm-line)] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="break-words text-2xl font-black leading-9">{scenario.name}</h3>
                        <p className="mt-3 max-w-5xl whitespace-pre-line text-sm font-bold leading-8 text-[var(--pm-muted)]">
                          {scenario.description || "توضیحی برای این سناریو ثبت نشده است."}
                        </p>
                      </div>
                      <span className="rounded-[var(--radius-full)] border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm font-black text-violet-700 dark:text-violet-300">
                        {totalPlayers || "؟"} نفر
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {alignments.map((alignment) => (
                        <span key={alignment} className={`rounded-[var(--radius-full)] border px-2.5 py-1 text-[10px] font-black ${alignmentClass(alignment)}`}>
                          {alignmentLabel(alignment)}: {counts[alignment]}
                        </span>
                      ))}
                    </div>
                  </header>

                  <div className="grid gap-3 p-4 xl:grid-cols-3">
                    {scenarioRoles.length ? (
                      scenarioRoles.map((role) => {
                        const abilities = normalizeRoleAbilities(role.nightAbilities);

                        return (
                          <section key={`${scenario.id}-${role.id}`} className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h4 className="break-words text-base font-black leading-7">{role.name}</h4>
                                <p className={`mt-1 inline-flex rounded-[var(--radius-full)] border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                                  {alignmentLabel(role.alignment)}
                                </p>
                              </div>
                              <span className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface)] px-2.5 py-1 text-xs font-black">
                                {roleCountLabel(role.count)}
                              </span>
                            </div>
                            <p className="mt-3 whitespace-pre-line text-xs font-bold leading-7 text-[var(--pm-muted)]">
                              {role.description || "توضیحی برای این نقش ثبت نشده است."}
                            </p>
                            <RoleAbilityList abilities={abilities} />
                          </section>
                        );
                      })
                    ) : (
                      <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--pm-line)] p-5 text-center text-sm font-bold text-[var(--pm-muted)] xl:col-span-3">
                        ترکیب نقش برای این سناریو ثبت نشده است.
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
