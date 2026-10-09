/**
 * Every player wears a colored mask. The hue is derived from a stable seed
 * (user id, or name for guests) so a player keeps the same color everywhere.
 */
// Twelve hues evenly spaced 30deg apart, so any two masks at the table are easy to tell apart.
export const PLAYER_HUES = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345] as const;

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function playerHue(seed: string | null | undefined) {
  if (!seed) return PLAYER_HUES[0];
  return PLAYER_HUES[hashSeed(seed) % PLAYER_HUES.length];
}

export function hueColor(hue: number) {
  return `oklch(0.72 0.15 ${hue})`;
}

export function playerColor(seed: string | null | undefined) {
  return hueColor(playerHue(seed));
}

/**
 * Distinct hues for everyone at one table: each player keeps their own hue
 * when it is free, otherwise takes the next free one around the wheel.
 * Order the seeds by join time so earlier players keep their color.
 */
export function assignTableHues(seeds: string[]) {
  const taken = new Set<number>();
  const result = new Map<string, number>();
  for (const seed of seeds) {
    if (result.has(seed)) continue;
    const start = PLAYER_HUES.indexOf(playerHue(seed) as (typeof PLAYER_HUES)[number]);
    let hue: number = PLAYER_HUES[start];
    for (let step = 0; step < PLAYER_HUES.length; step++) {
      const candidate = PLAYER_HUES[(start + step) % PLAYER_HUES.length];
      if (!taken.has(candidate)) {
        hue = candidate;
        break;
      }
    }
    taken.add(hue);
    result.set(seed, hue);
  }
  return result;
}
