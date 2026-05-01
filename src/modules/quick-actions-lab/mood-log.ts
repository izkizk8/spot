/**
 * In-memory mood log — session-scoped side effect of the
 * `add-mood-happy` quick action.
 *
 * Feature: 039-quick-actions
 * @see specs/039-quick-actions/research.md §Decision 4
 *
 * Cleared on app reload. No AsyncStorage, no persistence.
 */

export interface MoodEntry {
  mood: string;
  source: 'quick-action' | string;
  /** ISO 8601 timestamp captured by the writer. */
  timestamp: string;
}

let entries: MoodEntry[] = [];

export function appendMoodEntry(entry: MoodEntry): void {
  entries.push({ ...entry });
}

/** Returns a defensive copy so callers cannot mutate the internal array. */
export function getMoodEntries(): readonly MoodEntry[] {
  return entries.slice();
}

export function clearMoodEntries(): void {
  entries = [];
}
