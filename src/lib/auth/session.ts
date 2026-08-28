const SESSION_KEY = "masareefy.session.role";

export type SessionRole = "admin" | "user";

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`masareefy:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getSessionRole(): SessionRole {
  if (typeof window === "undefined") return "user";
  return window.sessionStorage.getItem(SESSION_KEY) === "admin"
    ? "admin"
    : "user";
}

export function setSessionRole(role: SessionRole): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, role);
}

export async function verifyAdminPin(
  pin: string,
  storedHash: string | null,
): Promise<{ ok: boolean; newHash: string | null }> {
  const hash = await hashPin(pin);
  if (!storedHash) {
    return { ok: true, newHash: hash };
  }
  return { ok: hash === storedHash, newHash: null };
}

export function isAdminSession(): boolean {
  return getSessionRole() === "admin";
}
