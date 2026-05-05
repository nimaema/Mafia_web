export function profileImageUrl(userId?: string | null, image?: string | null) {
  const value = image?.trim();
  if (!value) return null;

  if (/^data:image\//i.test(value)) {
    return userId ? `/api/user/avatar/${encodeURIComponent(userId)}` : null;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
    return value;
  }

  return null;
}
