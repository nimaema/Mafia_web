export type Phase = "DAY" | "NIGHT" | "VOTE";

const ORDINALS = ["", "اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم", "نهم", "دهم", "یازدهم", "دوازدهم", "سیزدهم", "چهاردهم", "پانزدهم"];

export function ordinalFa(n: number) {
  return ORDINALS[n] || `${n.toLocaleString("fa-IR")}م`;
}

export function phaseWord(phase: Phase | null | undefined) {
  if (phase === "NIGHT") return "شب";
  if (phase === "VOTE") return "رأی";
  return "روز";
}

/** "شب دوم", "روز سوم", "رأی‌گیری روز دوم", "روز معارفه" */
export function phaseTitle(phase: Phase | null | undefined, n: number) {
  if (!phase) return "بازی در جریان";
  if (phase === "DAY" && n === 0) return "روز معارفه";
  if (phase === "VOTE") return n === 0 ? "رأی‌گیری" : `رأی‌گیری روز ${ordinalFa(n)}`;
  return `${phaseWord(phase)} ${ordinalFa(n)}`;
}

export const PHASE_COPY: Record<Phase, string> = {
  NIGHT: "شهر خواب است. چشم‌ها بسته. فقط وقتی گرداننده صدایتان زد بیدار شوید.",
  DAY: "همه بیدارند. حرف بزنید، شک کنید و از خودتان دفاع کنید.",
  VOTE: "وقت تصمیم است. با رأی شما یک نفر از بازی بیرون می‌رود.",
};

/** Drench surface + ink for each phase (identical in day and night theme). */
export const PHASE_SURFACE: Record<Phase, string> = {
  NIGHT: "bg-night text-moon",
  DAY: "bg-day text-day-ink",
  VOTE: "bg-verdict text-verdict-ink",
};

/**
 * The moderator logbook numbers rounds so that "day r" comes before "night r"
 * (day 1 is the introduction day). Players see the same day as "روز معارفه",
 * then "روز اول" after the first night. Use these labels everywhere so both match.
 */
export function logbookDayLabel(round: number) {
  return round <= 1 ? "روز معارفه" : `روز ${ordinalFa(round - 1)}`;
}

export function logbookNightLabel(round: number) {
  return `شب ${ordinalFa(Math.max(1, round))}`;
}
