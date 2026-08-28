/**
 * Capacitor Preferences bridge — offline Android storage sync.
 *
 * WebView `localStorage` works in Capacitor but can be cleared by the OS under
 * storage pressure. `@capacitor/preferences` persists data in native SharedPreferences
 * and survives app restarts more reliably.
 *
 * Strategy:
 * 1. Keep `localStorage` as the primary read/write path (see local-repository.ts).
 * 2. On native Android, mirror `Masareefy.v1` to Preferences after each write.
 * 3. On app launch, hydrate localStorage from Preferences if local is empty.
 *
 * Usage (after `npx cap add android` and wiring in app bootstrap):
 *   await hydrateLocalStorageFromPreferences();
 *   // after repository writes:
 *   await mirrorLocalStorageToPreferences();
 */

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/** Same key as LocalExpenseRepository (`local-repository.ts`). */
export const PREFERENCES_STORAGE_KEY = "masareefy.v1";
export const LEGACY_PREFERENCES_KEYS = [
  "Masareefy.v1",
  "masroofy.v1",
  "Masroofy.v1",
] as const;

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

/**
 * Copy the full localStorage blob to Capacitor Preferences.
 * No-op on web or when localStorage is empty.
 */
export async function mirrorLocalStorageToPreferences(): Promise<void> {
  if (!isNativeAndroid() || typeof window === "undefined") return;

  const raw =
    window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ??
    LEGACY_PREFERENCES_KEYS.map((key) => window.localStorage.getItem(key)).find(
      (value) => value != null,
    );
  if (raw == null) return;

  await Preferences.set({ key: PREFERENCES_STORAGE_KEY, value: raw });
}

/**
 * Restore localStorage from Preferences when local is empty (first launch / OS wipe).
 */
export async function hydrateLocalStorageFromPreferences(): Promise<void> {
  if (!isNativeAndroid() || typeof window === "undefined") return;

  const existing =
    window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ??
    LEGACY_PREFERENCES_KEYS.map((key) => window.localStorage.getItem(key)).find(
      (value) => value != null,
    );
  if (existing != null) return;

  const { value } = await Preferences.get({ key: PREFERENCES_STORAGE_KEY });
  if (value != null) {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, value);
  }
}

/**
 * One-shot bootstrap: hydrate then register a storage listener for future mirrors.
 * Call once from a client-only entry (e.g. layout effect or Capacitor app listener).
 */
export async function initPreferencesBridge(): Promise<void> {
  if (!isNativeAndroid()) return;

  await hydrateLocalStorageFromPreferences();

  if (typeof window === "undefined") return;

  window.addEventListener("storage", () => {
    void mirrorLocalStorageToPreferences();
  });
}
