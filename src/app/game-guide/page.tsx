import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MaskMark } from "@/components/brand/MaskMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Notice } from "@/components/ui/Notice";
import { FactionTag } from "@/components/ui/Tag";
import { TEMP_SCENARIO_DESCRIPTION_PREFIX } from "@/lib/gameDisplay";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نقش‌ها و سناریوها",
  description: "راهنمای خوانای نقش‌ها، سناریوها، توانایی‌های شب و ترکیب‌های بازی در نقاب.",
  alternates: {
    canonical: "/game-guide",
  },
  openGraph: {
    title: "راهنمای بازی مافیا | نقاب",
    description: "راهنمای خوانای نقش‌ها، سناریوها، توانایی‌های شب و ترکیب‌های بازی.",
    url: "/game-guide",
    locale: "fa_IR",
    type: "article",
  },
};

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

const GROUP_TITLE: Record<GuideAlignment, string> = { CITIZEN: "شهروندان", MAFIA: "مافیا", NEUTRAL: "مستقل‌ها" };
const GROUP_BAR: Record<GuideAlignment, string> = { CITIZEN: "bg-citizen", MAFIA: "bg-mafia", NEUTRAL: "bg-independent" };
const toFa = (value: number) => value.toLocaleString("fa-IR");

function alignmentOrder(alignment?: string | null) {
  if (alignment === "CITIZEN") return 0;
  if (alignment === "MAFIA") return 1;
  return 2;
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
    <ul className="mt-4 flex flex-col gap-2">
      {abilities.map((ability) => (
        <li key={ability.id} className="rounded-[var(--radius-sm)] bg-raised p-3">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            <span className="text-xs font-extrabold text-accent">توانایی شب</span>
            {ability.label}
            {ability.effectType && ability.effectType !== "NONE" ? <span className="nq-tag bg-accent-soft text-accent">{effectLabel(ability.effectType)}</span> : null}
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-muted">{abilityUsageLabel(ability)}</p>
          {ability.choices.length > 0 ? (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {ability.choices.map((choice) => (
                <span key={choice.id} className="nq-tag">
                  {choice.label}
                </span>
              ))}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function RoleRow({ role, count, showFaction = true }: { role: { id: string; name: string; description?: string | null; alignment?: string | null; nightAbilities?: unknown }; count?: number; showFaction?: boolean }) {
  const abilities = normalizeRoleAbilities(role.nightAbilities);
  return (
    <details className="group border-b border-line last:border-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3">
        <span className="min-w-0 flex-1 font-extrabold">
          {role.name}
          {count && count > 1 ? <span className="ms-2 text-sm font-bold text-muted">{`× ${toFa(count)}`}</span> : null}
        </span>
        {showFaction ? <FactionTag alignment={role.alignment} /> : null}
        <CaretDown size={18} weight="bold" className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-5">
        <p className="whitespace-pre-line font-medium leading-8 text-muted">{role.description || "توضیحی برای این نقش ثبت نشده است."}</p>
        <RoleAbilityList abilities={abilities} />
      </div>
    </details>
  );
}

export default async function GameGuidePage() {
  const { roles, scenarios, unavailable } = await getGuideLibrary();
  const roleGroups = alignments
    .map((alignment) => ({ alignment, roles: roles.filter((role) => role.alignment === alignment) }))
    .filter((group) => group.roles.length > 0);

  return (
    <main className="min-h-dvh bg-canvas pb-20 text-fg" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 pb-2 pt-[max(env(safe-area-inset-top),0.6rem)]">
          <Link href="/" aria-label="نقاب" className="flex items-center gap-2">
            <Wordmark className="h-9 text-fg" title="" />
            <MaskMark className="h-4 text-accent" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard/user" className="nq-btn nq-btn-secondary nq-btn-sm">
              رفتن به بازی
              <ArrowLeft size={16} weight="bold" aria-hidden />
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-5 pb-2" aria-label="بخش‌های راهنما">
          <a href="#roles" className="nq-btn nq-btn-ghost nq-btn-sm">{`نقش‌ها (${toFa(roles.length)})`}</a>
          <a href="#scenarios" className="nq-btn nq-btn-ghost nq-btn-sm">{`سناریوها (${toFa(scenarios.length)})`}</a>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-5">
        <section className="pt-10">
          <h1 className="nq-display text-[3rem] leading-[1.1] sm:text-[3.6rem]">نقش‌ها و سناریوها</h1>
          <p className="mt-2 max-w-xl font-medium leading-8 text-muted">هر نقش چه می‌کند، شب‌ها چه توانایی دارد، و هر سناریو با چه ترکیبی بازی می‌شود. روی هر نقش بزنید تا توضیحش باز شود.</p>
        </section>

        {unavailable ? (
          <Notice tone="warning" className="mt-8">
            کتابخانه نقش‌ها و سناریوها الان در دسترس نیست. کمی بعد دوباره سر بزنید.
          </Notice>
        ) : null}

        <section id="roles" className="scroll-mt-32 pt-12" aria-labelledby="roles-title">
          <h2 id="roles-title" className="nq-display text-[2.2rem] leading-tight">
            نقش‌ها
          </h2>
          {roleGroups.length === 0 ? (
            <p className="mt-4 font-medium text-muted">نقشی برای نمایش نیست.</p>
          ) : (
            <div className="mt-5 flex flex-col gap-8">
              {roleGroups.map((group) => (
                <section key={group.alignment} aria-label={GROUP_TITLE[group.alignment]}>
                  <h3 className="flex items-center gap-3 text-lg font-extrabold">
                    <span className={`h-5 w-1.5 rounded-full ${GROUP_BAR[group.alignment]}`} aria-hidden />
                    {GROUP_TITLE[group.alignment]}
                    <span className="text-sm font-bold text-muted">{`${toFa(group.roles.length)} نقش`}</span>
                  </h3>
                  <div className="mt-2 rounded-[var(--radius-lg)] border border-line bg-surface px-5">
                    {group.roles.map((role) => (
                      <RoleRow key={role.id} role={role} showFaction={false} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <section id="scenarios" className="scroll-mt-32 pt-16" aria-labelledby="scenarios-title">
          <h2 id="scenarios-title" className="nq-display text-[2.2rem] leading-tight">
            سناریوها
          </h2>
          {scenarios.length === 0 ? (
            <p className="mt-4 font-medium text-muted">سناریویی برای نمایش نیست.</p>
          ) : (
            <div className="mt-5 flex flex-col gap-4">
              {scenarios.map((scenario) => {
                const total = scenarioTotalPlayers(scenario);
                const counts = scenarioAlignmentCounts(scenario);
                const scenarioRoles = sortRoles(scenario.roles.map((item) => ({ ...item.role, count: item.count })));
                return (
                  <article key={scenario.id} className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-extrabold leading-8">{scenario.name}</h3>
                      <span className="nq-tag shrink-0 bg-accent-soft text-accent">{total ? `${toFa(total)} نفر` : "؟ نفر"}</span>
                    </div>
                    {scenario.description ? <p className="mt-2 whitespace-pre-line font-medium leading-8 text-muted">{scenario.description}</p> : null}
                    {total ? (
                      <div className="mt-4">
                        <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden>
                          {alignments.map((alignment) =>
                            counts[alignment] ? <span key={alignment} className={GROUP_BAR[alignment]} style={{ width: `${(counts[alignment] / total) * 100}%` }} /> : null,
                          )}
                        </div>
                        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
                          {alignments.map((alignment) =>
                            counts[alignment] ? (
                              <span key={alignment} className="flex items-center gap-1.5">
                                <span className={`size-2 rounded-full ${GROUP_BAR[alignment]}`} aria-hidden />
                                {`${toFa(counts[alignment])} ${GROUP_TITLE[alignment]}`}
                              </span>
                            ) : null,
                          )}
                        </p>
                      </div>
                    ) : null}
                    {scenarioRoles.length ? (
                      <details className="group mt-4 border-t border-line">
                        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between pt-3 text-sm font-extrabold text-accent">
                          نقش‌های این سناریو
                          <CaretDown size={16} weight="bold" className="transition-transform group-open:rotate-180" aria-hidden />
                        </summary>
                        <div>
                          {scenarioRoles.map((role) => (
                            <RoleRow key={`${scenario.id}-${role.id}`} role={role} count={role.count} />
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
