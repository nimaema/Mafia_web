const FALLBACK_SITE_URL = "https://playmafia.live";

type HeaderReader = {
  get(name: string): string | null;
};

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

function getRequestOrigin(headers?: HeaderReader, requestUrl?: string) {
  const fallbackOrigin = requestUrl ? normalizeBaseUrl(new URL(requestUrl).origin) : null;
  const host = headers?.get("x-forwarded-host") || headers?.get("host");
  if (!host) return fallbackOrigin;

  const proto =
    headers?.get("x-forwarded-proto") ||
    (requestUrl ? new URL(requestUrl).protocol.replace(":", "") : null) ||
    "http";

  return normalizeBaseUrl(`${proto}://${host}`) || fallbackOrigin;
}

export function getConfiguredSiteUrl() {
  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.NEXTAUTH_URL) ||
    normalizeBaseUrl(process.env.AUTH_URL) ||
    FALLBACK_SITE_URL
  );
}

export function getTrustedBaseUrlFromHeaders(headers?: HeaderReader) {
  const configured = getConfiguredSiteUrl();
  const requestOrigin = getRequestOrigin(headers);

  if (process.env.NODE_ENV !== "production" && requestOrigin && isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }

  return configured;
}

export function getTrustedBaseUrlFromRequest(request: Request) {
  const configured = getConfiguredSiteUrl();
  const requestOrigin = getRequestOrigin(request.headers, request.url);

  if (process.env.NODE_ENV !== "production" && requestOrigin && isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }

  return configured;
}
