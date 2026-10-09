/**
 * Every player wears a colored mask. The hue is derived from a stable seed
 * (user id, or name for guests) so a player keeps the same color everywhere.
 */
export const PLAYER_HUES = [15, 85, 160, 240, 300, 200, 50, 130, 345, 270, 105, 180] as const;

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

export function playerColor(seed: string | null | undefined) {
  return `oklch(0.72 0.15 ${playerHue(seed)})`;
}
