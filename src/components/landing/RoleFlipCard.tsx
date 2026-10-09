"use client";

import { useState } from "react";
import { ArrowsClockwise, HandTap } from "@phosphor-icons/react";
import { MaskMark } from "@/components/brand/MaskMark";
import { FACTION, type Faction } from "@/lib/faction";

type SampleRole = { name: string; alignment: Faction; line: string };

const ROLES: SampleRole[] = [
  { name: "دکتر", alignment: "CITIZEN", line: "هر شب یک نفر را نجات می‌دهید. خودتان را فقط یک بار." },
  { name: "پدرخوانده", alignment: "MAFIA", line: "تصمیم شلیک شب با شماست و استعلامتان منفی است." },
  { name: "کارآگاه", alignment: "CITIZEN", line: "هر شب از گرداننده می‌پرسید یک نفر مافیاست یا نه." },
  { name: "زودیاک", alignment: "NEUTRAL", line: "نه با شهرید نه با مافیا. تنها برنده آخر بازی شمایید." },
  { name: "اسنایپر", alignment: "CITIZEN", line: "یک گلوله دارید. اگر به شهروند بزنید، خودتان می‌روید." },
  { name: "دکتر لکتر", alignment: "MAFIA", line: "هر شب یکی از هم‌تیمی‌هایتان را از تیر شهر نجات می‌دهید." },
  { name: "شهروند ساده", alignment: "CITIZEN", line: "سلاحتان حرف و رأی است. و همین برای بردن کافی است." },
];

const FACE_COLOR: Record<Faction, string> = {
  CITIZEN: "oklch(0.8 0.12 188)",
  MAFIA: "oklch(0.7 0.18 22)",
  NEUTRAL: "oklch(0.83 0.14 82)",
};

/** Landing signature: a real role card the visitor flips to draw a role, like the first night at the table. */
export function RoleFlipCard() {
  const [revealed, setRevealed] = useState(false);
  const [index, setIndex] = useState(0);
  const role = ROLES[index];
  const color = FACE_COLOR[role.alignment];

  const toggle = () => {
    if (revealed) {
      setRevealed(false);
      // Draw the next role while the card is face down.
      window.setTimeout(() => setIndex((i) => (i + 1) % ROLES.length), 260);
    } else {
      setRevealed(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={toggle}
        aria-label={revealed ? `نقش: ${role.name}. برای کشیدن نقش دیگر لمس کنید` : "برای دیدن نقش، کارت را برگردانید"}
        className="group relative aspect-[3/4.2] w-[17.5rem] [perspective:1400px] focus-visible:outline-offset-8 sm:w-[19rem]"
      >
        <span
          className={`relative block size-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${
            revealed ? "[transform:rotateY(180deg)]" : "group-hover:[transform:rotateY(-8deg)]"
          }`}
        >
          {/* Back: khatam tile, the mask, and the invitation */}
          <span className="nq-khatam absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-[1.6rem] border border-[oklch(0.8_0.12_188/0.5)] bg-[oklch(0.215_0.04_255)] text-[oklch(0.8_0.12_188)] [backface-visibility:hidden] [--nq-khatam-stroke:oklch(0.8_0.12_188/0.32)]">
            <span className="absolute inset-3.5 rounded-[1.15rem] border border-[oklch(0.8_0.12_188/0.3)]" />
            <MaskMark className="relative w-28 drop-shadow-[0_10px_24px_oklch(0.8_0.12_188/0.35)]" />
            <span className="relative flex items-center gap-2 rounded-full bg-[oklch(0.17_0.035_255)] px-4 py-2 text-sm font-extrabold text-[oklch(0.95_0.01_230)]">
              <HandTap size={18} weight="bold" aria-hidden />
              نقشتان را ببینید
            </span>
          </span>

          {/* Face: the drawn role */}
          <span className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-[1.6rem] border bg-[oklch(0.215_0.04_255)] px-6 pb-7 pt-9 text-center text-[oklch(0.95_0.01_230)] [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ borderColor: `color-mix(in oklab, ${color} 55%, transparent)` }}>
            <span className="absolute inset-x-0 top-0 h-2/3 opacity-25" style={{ background: `radial-gradient(70% 60% at 50% 0%, ${color}, transparent)` }} />
            <span className="relative" style={{ color }}>
              <MaskMark className="w-32" />
            </span>
            <span className="relative mt-3 text-[0.8rem] font-bold text-[oklch(0.76_0.03_235)]">شما هستید</span>
            <span className="nq-display relative text-[3.4rem] leading-[1.15]" style={{ color }}>
              {role.name}
            </span>
            <span className="relative mt-1 rounded-full px-3 py-1 text-xs font-extrabold" style={{ color, background: `color-mix(in oklab, ${color} 16%, transparent)` }}>
              {FACTION[role.alignment].label}
            </span>
            <span className="relative mt-auto text-sm font-medium leading-7 text-[oklch(0.82_0.02_235)]">{role.line}</span>
          </span>
        </span>
      </button>
      <p className="flex h-6 items-center gap-1.5 text-sm font-bold text-moon/75" aria-live="polite">
        {revealed ? (
          <>
            <ArrowsClockwise size={16} weight="bold" aria-hidden />
            دوباره لمس کنید تا نقش دیگری بکشید
          </>
        ) : (
          "سر میز، هیچ‌کس نقش شما را نمی‌بیند."
        )}
      </p>
    </div>
  );
}
