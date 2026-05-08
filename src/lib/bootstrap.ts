import { timingSafeEqual } from "crypto";

const WEAK_BOOTSTRAP_PASSWORDS = new Set([
  "admin",
  "admin123",
  "password",
  "password123",
  "mafia123",
  "admin@123",
  "admin@12345",
]);

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function isBootstrapRequestAuthorized(request: Request) {
  const expectedToken =
    process.env.BOOTSTRAP_TOKEN ||
    process.env.INIT_DB_TOKEN ||
    process.env.SETUP_ADMIN_TOKEN ||
    "";

  if (!expectedToken && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!expectedToken) return false;

  const providedToken = request.headers.get("x-bootstrap-token")?.trim() || bearerToken(request);
  return Boolean(providedToken) && safeCompare(providedToken, expectedToken);
}

export function getInitialAdminConfig() {
  const email = (process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@mafia.com").trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";

  return { email, password };
}

export function validateBootstrapPassword(password: string) {
  const normalized = password.trim();

  if (normalized.length < 12) {
    return "INITIAL_ADMIN_PASSWORD must be at least 12 characters long.";
  }

  if (WEAK_BOOTSTRAP_PASSWORDS.has(normalized.toLowerCase())) {
    return "INITIAL_ADMIN_PASSWORD is too common for an admin bootstrap password.";
  }

  return null;
}
