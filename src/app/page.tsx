import Link from "next/link";
import { ArrowLeft, BookOpenText, Cards, DoorOpen, Notebook } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Crescent } from "@/components/brand/Crescent";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
import { MaskMark } from "@/components/brand/MaskMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { assignTableHues } from "@/lib/playerColor";
import { RoleFlipCard } from "@/components/landing/RoleFlipCard";

const PHASES = [
  {
    word: "شب",
    text: "شهر می‌خوابد. گرداننده یکی‌یکی بیدارتان می‌کند و انتخاب شما را ثبت می‌کند.",
    className: "bg-night text-moon",
  },
  {
    word: "روز",
    text: "همه بیدارند. حرف می‌زنید، شک می‌کنید و از خودتان دفاع می‌کنید.",
    className: "bg-day text-day-ink",
  },
  {
    word: "رأی",
    text: "یک نفر از بازی بیرون می‌رود و نقابش می‌شکند. نقشش برای همه رو می‌شود.",
    className: "bg-verdict text-verdict-ink",
  },
  {
    word: "گزارش",
    text: "بعد از آخرین رأی، داستان کامل شب‌ها و روزها برای همه منتشر می‌شود.",
    className: "nq-khatam bg-surface text-fg border border-line",
  },
] as const;

const TABLE = [
  "نیما", "سارا", "کیان", "مینا", "آرش", "بهار", "رضا", "پریسا", "هومن", "شیرین", "امید", "لیلا",
  "دانیال", "نگار", "سپهر", "یاسمن", "پویا", "ترانه",
];

const MODERATOR_TOOLS = [
  { icon: DoorOpen, title: "لابی با یک کد", text: "لابی می‌سازید، کد شش‌رقمی را سر میز می‌خوانید و همه با گوشی خودشان وارد می‌شوند." },
  { icon: Cards, title: "پخش نقش با یک لمس", text: "سناریو را انتخاب می‌کنید و نقش‌ها مخفیانه روی گوشی هر نفر می‌رسد." },
  { icon: Notebook, title: "دفترچه شب، بدون کاغذ", text: "کارهای هر شب، حذف‌ها و نتیجه ثبت می‌شود و گزارش بازی خودش نوشته می‌شود." },
] as const;

export default async function Home() {
  const session = await auth();
  const tableHues = assignTableHues(TABLE);
  const signedIn = Boolean(session?.user);

  return (
    <main className="min-h-dvh bg-canvas text-fg" dir="rtl">
      {/* Hero: the night */}
      <section className="nq-grain relative overflow-hidden bg-night text-moon">
        <Crescent className="pointer-events-none absolute -left-28 top-[30rem] w-80 text-moon opacity-80 lg:-left-10 lg:top-16 lg:w-[34rem] lg:opacity-60" />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1.1rem)] lg:px-8 lg:pt-7">
          <Link href="/" aria-label="نقاب">
            <Wordmark className="h-11 text-moon lg:h-12" title="" />
          </Link>
          <ThemeToggle tone="drench" />
        </header>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 lg:min-h-[min(calc(100dvh-5rem),46rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8 lg:pb-20 lg:pt-6">
          <div className="motion-reveal">
            <h1 className="nq-display text-[3.7rem] leading-[1.05] sm:text-[4.6rem] lg:text-[5.75rem]">هر کس نقابی دارد.</h1>
            <p className="mt-5 max-w-md text-[1.05rem] font-medium leading-8 text-moon/85 lg:text-lg lg:leading-9">
              نقش مخفی روی گوشی خودتان، شب و روز با یک لمس، و داستان کامل بازی بعد از آخرین رأی.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {signedIn ? (
                <Link href="/dashboard" className="nq-btn nq-btn-primary nq-btn-lg sm:min-w-52">
                  رفتن به بازی‌ها
                  <ArrowLeft size={20} weight="bold" aria-hidden />
                </Link>
              ) : (
                <>
                  <Link href="/auth/register" className="nq-btn nq-btn-primary nq-btn-lg sm:min-w-48">
                    ساخت حساب
                    <ArrowLeft size={20} weight="bold" aria-hidden />
                  </Link>
                  <Link href="/auth/login" className="nq-btn nq-btn-lg bg-moon/12 text-moon hover:bg-moon/20 sm:min-w-36">
                    ورود
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="motion-pop flex justify-center lg:justify-end">
            <RoleFlipCard />
          </div>
        </div>
      </section>

      {/* How a game moves: the phase posters */}
      <section className="mx-auto max-w-6xl py-16 lg:px-8 lg:py-24">
        <div className="px-5 lg:px-0">
          <h2 className="nq-display text-[2.6rem] leading-tight lg:text-[3.4rem]">شب، روز، رأی.</h2>
          <p className="mt-3 max-w-xl text-base font-medium leading-8 text-muted">
            وقتی گرداننده بازی را جلو می‌برد، صفحه همه گوشی‌ها با هم عوض می‌شود. هیچ‌کس جا نمی‌ماند.
          </p>
        </div>
        <ol className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {PHASES.map((phase) => (
            <li
              key={phase.word}
              className={`nq-grain flex min-h-[19rem] w-[72%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] p-6 sm:w-[45%] lg:w-auto ${phase.className}`}
            >
              <span className="nq-display relative z-10 text-[4.2rem] leading-none">{phase.word}</span>
              <p className="relative z-10 text-[0.95rem] font-semibold leading-7 opacity-90">{phase.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Every player's own mask */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <h2 className="nq-display text-[2.6rem] leading-tight lg:text-[3.4rem]">نقاب شما، فقط مال شماست.</h2>
            <p className="mt-3 max-w-lg text-base font-medium leading-8 text-muted">
              هر بازیکن رنگ و نقاب خودش را دارد. در لابی، وسط بازی و در گزارش آخر، همه شما را از نقابتان می‌شناسند.
            </p>
          </div>
          <ul className="grid grid-cols-6 gap-2.5 sm:gap-3" aria-label="نمونه بازیکنان سر میز">
            {TABLE.map((name, index) => (
              <li key={name} className="flex flex-col items-center gap-1.5">
                <MaskAvatar seed={name} hue={tableHues.get(name)} size="lg" eliminated={index === 6 || index === 13} className="!size-12 sm:!size-14" />
                <span className={`text-[0.7rem] font-bold sm:text-xs ${index === 6 || index === 13 ? "text-faint line-through" : "text-muted"}`}>{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* For moderators */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <h2 className="nq-display text-[2.6rem] leading-tight lg:text-[3.4rem]">گرداننده‌اید؟</h2>
          <p className="mt-3 max-w-md text-base font-medium leading-8 text-muted">
            کل میز در یک گوشی. بدون کاغذ و خودکار، بدون جا انداختن یک شب.
          </p>
        </div>
        <ul className="flex flex-col gap-7">
          {MODERATOR_TOOLS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-accent-soft text-accent">
                <Icon size={24} weight="bold" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-extrabold">{title}</h3>
                <p className="mt-1 text-[0.95rem] font-medium leading-7 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <MaskMark className="h-5 text-accent" />
            <Wordmark className="h-8 text-fg" title="نقاب" />
            <span className="text-sm font-medium text-muted">از Turku Games</span>
          </div>
          <Link href="/game-guide" className="nq-btn nq-btn-secondary self-start sm:self-auto">
            <BookOpenText size={20} weight="bold" aria-hidden />
            نقش‌ها و سناریوها
          </Link>
        </div>
      </footer>
    </main>
  );
}
