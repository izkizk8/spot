/**
 * Mood store — AsyncStorage-backed shared source of truth between
 * the iOS Swift App Intents path and the JS UI path.
 *
 * Pure JS; no React.
 *
 * @see specs/013-app-intents/contracts/mood-store.md
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** One of the three Mood values shared with the Swift SpotMood enum. */
export type Mood = 'happy' | 'neutral' | 'sad';

/** A single record persisted to the mood store. */
export interface MoodRecord {
  readonly mood: Mood;
  readonly timestamp: number;
}

export const MOOD_STORE_KEY = 'spot.app-intents.moods';
export const MOOD_STORE_DISK_CAP = 100;
export const MOOD_STORE_DEFAULT_LIST_CAP = 100;
export const MOODS: readonly Mood[] = ['happy', 'neutral', 'sad'] as const;
export const DEFAULT_MOOD: Mood = 'neutral';

async function readAll(): Promise<MoodRecord[]> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(MOOD_STORE_KEY);
  } catch {
    return [];
  }
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as MoodRecord[];
  } catch {
    return [];
  }
}

/**
 * Append a new record. Truncates the on-disk array to
 * MOOD_STORE_DISK_CAP entries (oldest first removed).
 *
 * Lets `setItem` rejection propagate (FR-016).
 */
export async function push(record: MoodRecord): Promise<void> {
  const current = await readAll();
  const next = [...current, record].slice(-MOOD_STORE_DISK_CAP);
  await AsyncStorage.setItem(MOOD_STORE_KEY, JSON.stringify(next));
}

/**
 * Return entries newest-first, capped at `limit`
 * (default MOOD_STORE_DEFAULT_LIST_CAP). Resolves to []
 * on any read failure (FR-016).
 */
export async function list(opts?: { limit?: number }): Promise<readonly MoodRecord[]> {
  const limit = opts?.limit ?? MOOD_STORE_DEFAULT_LIST_CAP;
  if (limit <= 0) return [];
  const all = await readAll();
  // On-disk is oldest-first → reverse for newest-first then slice.
  const newestFirst = [...all].reverse();
  return newestFirst.slice(0, limit);
}

/** Remove every record. Lets `removeItem` rejection propagate. */
export async function clear(): Promise<void> {
  await AsyncStorage.removeItem(MOOD_STORE_KEY);
}
