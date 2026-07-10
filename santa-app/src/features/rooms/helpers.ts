export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 6);
}

export function isValidInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function cleanWishlistItems(items: string[]): string[] {
  return items.map((item) => item.trim()).filter((item) => item.length > 0);
}
