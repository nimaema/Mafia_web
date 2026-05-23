const RECOVERY_OTP_PREFIX = "admin-recovery-otp:";

export const RECOVERY_OTP_TTL_MS = 30 * 60 * 1000;

export function generateRecoveryOtp() {
  const numberSeed = new Uint32Array(1);
  crypto.getRandomValues(numberSeed);
  const suffixBytes = new Uint8Array(4);
  crypto.getRandomValues(suffixBytes);
  const digits = 100000 + (numberSeed[0] % 900000);
  const suffix = Array.from(suffixBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `Mafia-${digits}-${suffix}`;
}

export async function recoveryOtpToken(code: string) {
  const input = new TextEncoder().encode(code.trim());
  const digest = await crypto.subtle.digest("SHA-256", input);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${RECOVERY_OTP_PREFIX}${hash}`;
}
