export type Faction = "CITIZEN" | "MAFIA" | "NEUTRAL";

/** Faction is always shown with a label and an icon shape, never color alone. */
export const FACTION: Record<Faction, { label: string; text: string; bg: string; soft: string }> = {
  CITIZEN: { label: "شهروند", text: "text-citizen", bg: "bg-citizen", soft: "bg-citizen/14" },
  MAFIA: { label: "مافیا", text: "text-mafia", bg: "bg-mafia", soft: "bg-mafia/14" },
  NEUTRAL: { label: "مستقل", text: "text-independent", bg: "bg-independent", soft: "bg-independent/16" },
};

export function faction(alignment: string | null | undefined) {
  if (alignment === "MAFIA" || alignment === "NEUTRAL" || alignment === "CITIZEN") return FACTION[alignment];
  return null;
}
