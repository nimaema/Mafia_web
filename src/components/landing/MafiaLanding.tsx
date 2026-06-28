"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ data */

type Faction = "mafia" | "town";

const ROLES: Array<{ name: string; faction: Faction; ability: string; icon: string; tag: string }> = [
  { name: "پدرخوانده", faction: "mafia", tag: "رهبر", ability: "سرِ مافیا. در استعلامِ کارآگاه، بی‌گناه دیده می‌شود.", icon: "workspace_premium" },
  { name: "مافیا", faction: "mafia", tag: "مهاجم", ability: "هر شب همراه تیم، یک نفر از شهر را هدف می‌گیرد.", icon: "local_fire_department" },
  { name: "کارآگاه", faction: "town", tag: "تحقیق", ability: "هر شب هویتِ یک بازیکن را استعلام می‌کند.", icon: "travel_explore" },
  { name: "دکتر", faction: "town", tag: "محافظ", ability: "هر شب یک نفر را از شلیکِ مافیا نجات می‌دهد.", icon: "health_and_safety" },
  { name: "اسنایپر", faction: "town", tag: "تک‌تیر", ability: "یک‌بار در بازی، شبانه شلیک می‌کند — ریسکش با خودش.", icon: "gps_fixed" },
  { name: "شهروند", faction: "town", tag: "مردم", ability: "بدون توانایی ویژه؛ سلاحش گفت‌وگو، حافظه و رأی است.", icon: "groups" },
];

const PHASES = [
  { k: "۰۱", title: "معارفه", text: "نقش‌ها پخش می‌شود و چشم‌ها بسته. هیچ‌کس نمی‌داند کنارِ دستش کیست.", icon: "style" },
  { k: "۰۲", title: "شب", text: "مافیا بیدار می‌شود و هدف می‌گیرد. دکتر نجات می‌دهد، کارآگاه استعلام می‌گیرد.", icon: "bedtime" },
  { k: "۰۳", title: "روز", text: "شهر چشم باز می‌کند. اتهام، دفاع و بحث تا لحظهٔ رأی‌گیری بالا می‌گیرد.", icon: "wb_twilight" },
  { k: "۰۴", title: "اعدام", text: "رأیِ اکثریت یک نفر را از میز حذف می‌کند. و دوباره، شب فرا می‌رسد.", icon: "gavel" },
];

const SEATS = [
  "آرش", "نگار", "سهراب", "مونا", "بابک", "تینا", "کاوه", "رها", "فرید", "شیما",
];
const OUT = new Set([2, 7]); // eliminated seats

const HERO_WORDS = ["شب", "فرا", "می‌رسد."];
const HERO_WORDS_2 = ["میز", "آماده", "است."];

/* --------------------------------------------------------------- medallion */

// Round to avoid SSR/CSR float-serialization hydration mismatches.
const r2 = (n: number) => Math.round(n * 100) / 100;

function Medallion({ tone = "var(--stage-accent)" }: { tone?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      <circle cx="50" cy="50" r="33" fill="none" stroke={tone} strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="50" cy="50" r="25" fill="none" stroke={tone} strokeOpacity="0.35" strokeWidth="0.7" />
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={r2(50 + Math.cos(a) * 25)}
            y1={r2(50 + Math.sin(a) * 25)}
            x2={r2(50 + Math.cos(a) * 33)}
            y2={r2(50 + Math.sin(a) * 33)}
            stroke={tone}
            strokeOpacity="0.4"
            strokeWidth="0.7"
          />
        );
      })}
      <path d="M50 36 L57 50 L50 64 L43 50 Z" fill="none" stroke={tone} strokeOpacity="0.7" strokeWidth="1" />
    </svg>
  );
}

/* --------------------------------------------------------------- component */

export function MafiaLanding() {
  const stageRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [phase, setPhase] = useState<"night" | "day">("night");
  const [dealt, setDealt] = useState(false);
  const [flipped, setFlipped] = useState<number | null>(null);

  // Deal the deck on mount.
  useEffect(() => {
    const t = setTimeout(() => setDealt(true), 180);
    return () => clearTimeout(t);
  }, []);

  // Lamp follows the cursor (pointer devices only).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const r = stage.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        stage.style.setProperty("--lamp-x", `${x}%`);
        stage.style.setProperty("--lamp-y", `${Math.max(0, Math.min(70, y))}%`);
      });
    };
    stage.addEventListener("pointermove", onMove);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Scroll reveals.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("ms-in");
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const isNight = phase === "night";
  const aliveCount = SEATS.length - OUT.size;

  return (
    <main
      ref={stageRef}
      data-phase={phase}
      className="ms-stage min-h-screen overflow-hidden"
      dir="rtl"
    >
      {/* Lamp + dust */}
      <div className="ms-lamp-layer" aria-hidden="true">
        <div className="ms-lamp" />
        {[
          { l: "22%", t: "30%", s: 3, d: "0s" },
          { l: "38%", t: "62%", s: 2, d: "1.4s" },
          { l: "60%", t: "26%", s: 4, d: "2.1s" },
          { l: "74%", t: "54%", s: 2, d: "0.7s" },
          { l: "48%", t: "44%", s: 3, d: "3.2s" },
          { l: "84%", t: "34%", s: 2, d: "1.9s" },
        ].map((p, i) => (
          <span
            key={i}
            className="ms-dust"
            style={{ left: p.l, top: p.t, width: p.s, height: p.s, animationDelay: p.d }}
          />
        ))}
      </div>

      <div ref={rootRef} className="relative z-10">
        {/* ---------------------------------------------------------- nav */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="مافیا بورد">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--stage-accent)]/40 bg-gradient-to-b from-[var(--stage-accent)] to-[#9a6f28] text-[#1c1407] shadow-[0_14px_34px_rgba(212,173,85,0.25)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <span className="material-symbols-outlined text-[1.35rem]">playing_cards</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-2xl font-bold leading-6 text-[var(--stage-text)]">مافیا بورد</span>
              <span className="block truncate text-[11px] font-bold text-[var(--stage-muted)]">میزِ شب</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <PhaseToggle phase={phase} onToggle={() => setPhase(isNight ? "day" : "night")} />
            <Link
              href="/auth/login"
              className="hidden min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--stage-text)]/14 bg-[var(--stage-text)]/[0.06] px-4 text-sm font-bold text-[var(--stage-text)] backdrop-blur-xl transition duration-300 hover:border-[var(--stage-accent)]/45 hover:text-[var(--stage-accent)] sm:inline-flex"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              ورود
            </Link>
          </div>
        </header>

        {/* ---------------------------------------------------------- hero */}
        <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-12 pt-2 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.82fr)] lg:px-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] border border-[var(--stage-accent)]/22 bg-[var(--stage-accent)]/10 px-3.5 py-1.5 text-sm font-bold text-[var(--stage-accent)] backdrop-blur-xl">
              <span className="material-symbols-outlined text-base">{isNight ? "dark_mode" : "wb_twilight"}</span>
              {isNight ? "شب است — مافیا بیدار است" : "روز است — شهر رأی می‌دهد"}
            </div>

            <h1 className="mt-6 font-display text-[clamp(3.25rem,9vw,6.25rem)] font-bold leading-[0.92] text-[#f7efe0]">
              <span className="block">
                {HERO_WORDS.map((w, i) => (
                  <span key={i} className="ms-word ml-[0.18em]" style={{ ["--word-delay" as string]: `${i * 120}ms` }}>
                    {w}
                  </span>
                ))}
              </span>
              <span className="block text-[var(--stage-accent)]">
                {HERO_WORDS_2.map((w, i) => (
                  <span key={i} className="ms-word ml-[0.18em]" style={{ ["--word-delay" as string]: `${(i + HERO_WORDS.length) * 120}ms` }}>
                    {w}
                  </span>
                ))}
              </span>
            </h1>

            <p className="ms-reveal mt-6 max-w-xl text-lg font-semibold leading-9 text-[var(--stage-muted)]" data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              یک گردانندهٔ دیجیتال برای بازی مافیا: لابی زنده بساز، نقش‌های مخفی را امن پخش کن، چرخهٔ شب و روز را پیش ببر و گزارشِ کامل هر دور را نگه دار. تو فقط بازی را اجرا کن — کاغذبازی با ماست.
            </p>

            <div className="ms-reveal mt-9 flex flex-col gap-3 sm:flex-row" data-reveal style={{ ["--reveal-delay" as string]: "220ms" }}>
              <Link href="/auth/login" className="pm-button-primary ms-cta min-h-12 px-6 text-base">
                <span className="material-symbols-outlined text-xl">meeting_room</span>
                صندلیت را بگیر
              </Link>
              <Link href="/auth/register" className="pm-button-secondary min-h-12 px-6 text-base">
                <span className="material-symbols-outlined text-xl">person_add</span>
                ساخت حساب
              </Link>
            </div>

            <dl className="ms-reveal mt-11 grid max-w-lg grid-cols-3 gap-3" data-reveal style={{ ["--reveal-delay" as string]: "320ms" }}>
              {[
                { v: "۱۲", l: "نقشِ آماده" },
                { v: "∞", l: "لابی هم‌زمان" },
                { v: "۱۰۰٪", l: "گزارشِ دور" },
              ].map((s) => (
                <div key={s.l} className="rounded-[var(--radius-md)] border border-[var(--stage-text)]/10 bg-[var(--stage-text)]/[0.04] p-3.5 backdrop-blur-xl">
                  <p className="font-display text-3xl font-bold text-[var(--stage-text)]" dir="ltr">{s.v}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--stage-muted)]">{s.l}</p>
                </div>
              ))}
            </dl>
          </div>

          {/* dealt deck on a perspective table */}
          <div className="relative mx-auto flex min-h-[24rem] w-full max-w-md items-end justify-center sm:min-h-[30rem]">
            <div className={`ms-deck relative h-[20rem] w-full sm:h-[25rem] ${dealt ? "ms-dealt" : ""}`}>
              {[
                { rot: "-22deg", x: "-7.5rem", y: "0.6rem", delay: 0 },
                { rot: "-11deg", x: "-3.8rem", y: "-0.8rem", delay: 90 },
                { rot: "0deg", x: "0rem", y: "-1.4rem", delay: 180, hero: true },
                { rot: "11deg", x: "3.8rem", y: "-0.8rem", delay: 270 },
                { rot: "22deg", x: "7.5rem", y: "0.6rem", delay: 360 },
              ].map((c, i) => (
                <article
                  key={i}
                  className="ms-deal absolute left-1/2 top-1/2 h-[15rem] w-[10rem] rounded-[1rem] border p-2.5 shadow-[0_30px_70px_rgba(0,0,0,0.55)] sm:h-[19rem] sm:w-[12.5rem]"
                  style={{
                    ["--deal-rot" as string]: c.rot,
                    ["--deal-x" as string]: c.x,
                    ["--deal-y" as string]: c.y,
                    ["--deal-delay" as string]: `${c.delay}ms`,
                    zIndex: c.hero ? 5 : 2,
                    borderColor: c.hero ? "color-mix(in oklab, var(--stage-accent) 50%, transparent)" : "color-mix(in oklab, var(--stage-accent) 22%, transparent)",
                    background: c.hero
                      ? "linear-gradient(180deg, #2a1f33, #1a121f)"
                      : "linear-gradient(180deg, #241a2d, #15101c)",
                  }}
                >
                  {c.hero ? (
                    <div className="flex size-full flex-col items-center justify-between rounded-[0.7rem] border border-[var(--stage-accent)]/16 p-4">
                      <span className="self-start font-display text-xl font-bold text-[var(--stage-accent)]">مافیا</span>
                      <span className="grid size-16 place-items-center rounded-full border border-[#be4750]/40 bg-[#be4750]/12 shadow-[0_0_30px_rgba(190,71,80,0.3)] sm:size-20">
                        <span className="material-symbols-outlined text-3xl text-[#d6727a] sm:text-[2.6rem]">local_fire_department</span>
                      </span>
                      <span className="self-end rounded-full border border-[#d6727a]/30 bg-[#be4750]/12 px-2 py-0.5 text-[10px] font-black text-[#d6727a]">بدمن‌ها</span>
                    </div>
                  ) : (
                    <div className="size-full rounded-[0.7rem] border border-[var(--stage-accent)]/14 p-4 opacity-70">
                      <Medallion />
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* table edge */}
            <div className="pointer-events-none absolute -bottom-1 left-1/2 h-10 w-[120%] -translate-x-1/2 rounded-[50%] border-t border-[var(--stage-accent)]/20 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--stage-accent)_14%,transparent),transparent_70%)]" />
          </div>
        </section>

        {/* ---------------------------------------------------------- roles */}
        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="ms-reveal flex flex-wrap items-end justify-between gap-4" data-reveal>
            <div>
              <p className="text-sm font-black tracking-[0.18em] text-[var(--stage-accent)]">نقش‌ها</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-[var(--stage-text)] sm:text-5xl">کارت را برگردان، نقش را ببین</h2>
            </div>
            <p className="max-w-sm text-sm font-semibold leading-7 text-[var(--stage-muted)]">
              هر نقش یک توانایی و یک جبهه دارد. روی کارت نگه دار یا لمسش کن تا رو شود — درست مثل شبی که نقشت را زیر نور می‌خوانی.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {ROLES.map((role, i) => {
              const mafia = role.faction === "mafia";
              const accent = mafia ? "#d6727a" : "#8fb0cc";
              const ring = mafia ? "#be4750" : "#5e86a8";
              return (
                <button
                  key={role.name}
                  type="button"
                  data-reveal
                  data-flipped={flipped === i}
                  onClick={() => setFlipped(flipped === i ? null : i)}
                  className="ms-flip ms-reveal aspect-[3/4.4] text-right outline-none"
                  style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}
                  aria-label={`نقش ${role.name}`}
                >
                  <div className="ms-flip-inner size-full">
                    {/* face down */}
                    <div className="ms-flip-face flex flex-col items-center justify-between rounded-[var(--radius-lg)] border border-[var(--stage-accent)]/22 bg-gradient-to-b from-[#241a2d] to-[#15101c] p-3 shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
                      <span className="mt-1 self-end text-[10px] font-black text-[var(--stage-muted)]">؟</span>
                      <span className="size-12 opacity-70"><Medallion /></span>
                      <span className="mb-1 text-[11px] font-bold text-[var(--stage-muted)]">برگردان</span>
                    </div>
                    {/* revealed */}
                    <div
                      className="ms-flip-face ms-flip-back flex flex-col justify-between rounded-[var(--radius-lg)] border p-3.5 shadow-[0_22px_50px_rgba(0,0,0,0.5)]"
                      style={{ borderColor: `${ring}66`, background: "linear-gradient(180deg, #261c30, #160f1d)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] border" style={{ borderColor: `${ring}55`, background: `${ring}1f`, color: accent }}>
                          <span className="material-symbols-outlined text-lg">{role.icon}</span>
                        </span>
                        <span className="rounded-full border px-2 py-0.5 text-[9px] font-black" style={{ borderColor: `${ring}55`, color: accent }}>
                          {mafia ? "مافیا" : "شهر"}
                        </span>
                      </div>
                      <div>
                        <p className="font-display text-xl font-bold leading-tight" style={{ color: accent }}>{role.name}</p>
                        <p className="mt-1.5 text-[10.5px] font-semibold leading-5 text-[var(--stage-muted)]">{role.ability}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------ night sequence */}
        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="ms-reveal" data-reveal>
            <p className="text-sm font-black tracking-[0.18em] text-[var(--stage-accent)]">یک دور در میز</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-[var(--stage-text)] sm:text-5xl">شب، روز، و آن‌چه بینشان می‌گذرد</h2>
          </div>

          <ol className="relative mt-10 grid gap-4 md:grid-cols-4">
            {/* connecting rail (desktop) */}
            <span className="ms-rail absolute right-0 top-6 hidden h-0.5 w-full md:block" aria-hidden="true" />
            {PHASES.map((p, i) => (
              <li
                key={p.k}
                data-reveal
                className="ms-reveal relative rounded-[var(--radius-lg)] border border-[var(--stage-accent)]/16 bg-[var(--stage-text)]/[0.035] p-5 backdrop-blur-xl"
                style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="ms-node grid size-11 place-items-center rounded-full border border-[var(--stage-accent)]/40 bg-[#160f1d] text-[var(--stage-accent)]">
                    <span className="material-symbols-outlined text-xl">{p.icon}</span>
                  </span>
                  <span className="font-display text-3xl font-bold text-[var(--stage-accent)]/40" dir="ltr">{p.k}</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[var(--stage-text)]">{p.title}</h3>
                <p className="mt-2 text-[13px] font-semibold leading-7 text-[var(--stage-muted)]">{p.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------- the seats */}
        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
            <div className="ms-reveal" data-reveal>
              <p className="text-sm font-black tracking-[0.18em] text-[var(--stage-accent)]">میزِ زنده</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-[var(--stage-text)] sm:text-5xl">هر صندلی، یک سرنوشت</h2>
              <p className="mt-4 max-w-md text-base font-semibold leading-8 text-[var(--stage-muted)]">
                گرداننده میز را از یک نگاه می‌بیند: چه کسی زنده است، چه کسی حذف شده، نوبتِ کیست. حضور هر بازیکن زنده، لحظه‌به‌لحظه روی میز نفس می‌کشد.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--stage-accent)]/26 bg-[var(--stage-accent)]/10 px-3 py-1.5 text-xs font-black text-[var(--stage-accent)]">
                  <span className="size-1.5 rounded-full bg-[var(--stage-accent)]" /> {toFa(aliveCount)} زنده
                </span>
                <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[#d6727a]/26 bg-[#be4750]/10 px-3 py-1.5 text-xs font-black text-[#d6727a]">
                  <span className="material-symbols-outlined text-sm">close</span> {toFa(OUT.size)} حذف‌شده
                </span>
              </div>
            </div>

            {/* ring */}
            <div className="ms-reveal relative mx-auto aspect-square w-full max-w-md" data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <div className="absolute inset-[16%] rounded-full border border-[var(--stage-accent)]/16 bg-[radial-gradient(circle,color-mix(in_oklab,var(--stage-accent)_10%,transparent),transparent_72%)]" />
              <div className="absolute inset-[16%] grid place-items-center text-center">
                <div>
                  <span className="material-symbols-outlined text-3xl text-[var(--stage-accent)]">{isNight ? "dark_mode" : "wb_twilight"}</span>
                  <p className="mt-1 font-display text-2xl font-bold text-[var(--stage-text)]">میز شب</p>
                  <p className="text-[11px] font-bold text-[var(--stage-muted)]">{isNight ? "نوبتِ مافیا" : "نوبتِ شهر"}</p>
                </div>
              </div>
              {SEATS.map((name, i) => {
                const angle = -90 + (i / SEATS.length) * 360;
                const rad = (angle * Math.PI) / 180;
                const R = 44;
                const x = r2(50 + R * Math.cos(rad));
                const y = r2(50 + R * Math.sin(rad));
                const out = OUT.has(i);
                return (
                  <div
                    key={name}
                    className={`ms-seat absolute grid size-[18%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-center ${out ? "opacity-45" : "ms-seat-alive"}`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      ["--seat-delay" as string]: `${i * 240}ms`,
                      borderColor: out ? "rgba(214,114,122,0.4)" : "color-mix(in oklab, var(--stage-accent) 40%, transparent)",
                      background: out ? "rgba(190,71,80,0.1)" : "color-mix(in oklab, var(--stage-accent) 10%, #160f1d)",
                    }}
                    title={name}
                  >
                    <span className={`material-symbols-outlined text-[1.1rem] ${out ? "text-[#d6727a]" : "text-[var(--stage-accent)]"}`}>
                      {out ? "person_off" : "person"}
                    </span>
                    <span className="absolute -bottom-5 w-16 truncate text-[10px] font-bold text-[var(--stage-muted)]">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- final CTA */}
        <section className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10">
          <div className="ms-reveal pm-command relative overflow-hidden rounded-[var(--radius-xl)] p-8 text-center sm:p-14" data-reveal>
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-tight text-[var(--stage-text)] sm:text-6xl">
              میزت آماده‌ست. <span className="text-[var(--stage-accent)]">چراغ را روشن کن.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base font-semibold leading-8 text-[var(--stage-muted)]">
              یک حساب بساز، اولین لابی‌ات را همین امشب باز کن و بگذار بازی شروع شود.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/register" className="pm-button-primary ms-cta min-h-12 px-7 text-base">
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
                همین حالا شروع کن
              </Link>
              <Link href="/auth/login" className="pm-button-secondary min-h-12 px-7 text-base">
                ورود به حساب
              </Link>
            </div>
          </div>

          <p className="mt-10 text-center text-xs font-bold text-[var(--stage-muted)]">
            مافیا بورد — میزِ شب · ساخته‌شده برای گرداننده‌های ایرانی
          </p>
        </section>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------ subcomponents */

function PhaseToggle({ phase, onToggle }: { phase: "night" | "day"; onToggle: () => void }) {
  const isNight = phase === "night";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isNight ? "تغییر به روز" : "تغییر به شب"}
      className="group relative inline-flex h-11 w-[4.6rem] items-center rounded-[var(--radius-pill)] border border-[var(--stage-accent)]/30 bg-[var(--stage-text)]/[0.05] px-1 backdrop-blur-xl transition-colors duration-300"
    >
      <span
        className={`grid size-9 place-items-center rounded-full bg-gradient-to-b from-[var(--stage-accent)] to-[#9a6f28] text-[#1c1407] shadow-[0_6px_18px_rgba(212,173,85,0.35)] transition-transform duration-500 ${isNight ? "translate-x-0" : "-translate-x-[2.7rem]"}`}
      >
        <span className="material-symbols-outlined text-[1.15rem]">{isNight ? "dark_mode" : "light_mode"}</span>
      </span>
      <span className="material-symbols-outlined pointer-events-none absolute right-2.5 text-base text-[var(--stage-muted)]">light_mode</span>
      <span className="material-symbols-outlined pointer-events-none absolute left-2.5 text-base text-[var(--stage-muted)]">dark_mode</span>
    </button>
  );
}

function toFa(n: number) {
  return n.toLocaleString("fa-IR");
}
