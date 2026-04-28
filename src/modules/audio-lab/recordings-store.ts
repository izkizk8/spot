/**
 * Recordings store — AsyncStorage-backed CRUD for `audio-lab` (feature 020).
 *
 * data-model.md §9 + research.md R-003 + R-009.
 *
 * Invariants:
 *   - Single AsyncStorage key: `spot.audio.recordings`
 *   - Stored value: `JSON.stringify(Recording[])`
 *   - `loadRecordings()` is parse-tolerant (FR-034): never throws to caller;
 *     returns `[]` and emits a single `console.warn` on JSON failure.
 *   - On iOS/Android, `loadRecordings()` filters out entries whose `uri`
 *     is missing on disk and re-persists the cleaned list (FR-017).
 *   - `deleteRecording` removes the on-disk file via
 *     `FileSystem.deleteAsync({ idempotent: true })` (no-op on Web).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Recording } from './audio-types';

export const STORAGE_KEY = 'spot.audio.recordings';
const RECORDINGS_DIRNAME = 'recordings';

/**
 * `expo-file-system/legacy` accessor. Uses synchronous `require` so the call
 * site can `await` the surrounding async work without engaging the Node ESM
 * VM (Jest runs in CommonJS mode without --experimental-vm-modules).
 *
 * The legacy surface is used because the new `Paths`/`File` API does not yet
 * support all the URI shapes returned by `expo-audio`'s recorder.
 */
function fs(): typeof import('expo-file-system/legacy') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-file-system/legacy');
}

async function readRaw(): Promise<Recording[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[audio-lab] AsyncStorage value is not an array; resetting to []');
      return [];
    }
    return parsed as Recording[];
  } catch {
    console.warn('[audio-lab] Failed to parse recordings from AsyncStorage; resetting to []');
    return [];
  }
}

async function persist(list: Recording[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function loadRecordings(): Promise<Recording[]> {
  const list = await readRaw();
  if (Platform.OS === 'web' || list.length === 0) {
    return list;
  }
  const { getInfoAsync } = fs();
  const kept: Recording[] = [];
  let dropped = 0;
  for (const r of list) {
    try {
      const info = await getInfoAsync(r.uri);
      if (info.exists) {
        kept.push(r);
      } else {
        console.warn(`[audio-lab] Pruning recording ${r.id} — file missing: ${r.uri}`);
        dropped += 1;
      }
    } catch {
      console.warn(`[audio-lab] getInfoAsync failed for ${r.uri}; pruning`);
      dropped += 1;
    }
  }
  if (dropped > 0) {
    await persist(kept);
  }
  return kept;
}

/**
 * De-duplicate `name` against the existing list by appending `-1`, `-2`, …
 * before the `.m4a` extension. R-003.
 */
function dedupeName(name: string, existing: readonly Recording[]): string {
  const taken = new Set(existing.map((r) => r.name));
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf('.');
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot) : '';
  for (let i = 1; i < 10_000; i += 1) {
    const candidate = `${base}-${i}${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Defensive: should be unreachable in practice.
  return `${base}-${Date.now()}${ext}`;
}

export async function saveRecording(record: Recording): Promise<Recording[]> {
  const current = await readRaw();
  const dedupedName = dedupeName(record.name, current);
  const next: Recording[] = [...current, { ...record, name: dedupedName }];
  await persist(next);
  return next;
}

export async function deleteRecording(id: string): Promise<Recording[]> {
  const current = await readRaw();
  const target = current.find((r) => r.id === id);
  const next = current.filter((r) => r.id !== id);
  if (target && Platform.OS !== 'web') {
    const { deleteAsync } = fs();
    try {
      await deleteAsync(target.uri, { idempotent: true });
    } catch (err) {
      console.warn(`[audio-lab] deleteAsync failed for ${target.uri}`, err);
    }
  }
  if (target) {
    await persist(next);
  }
  return next;
}

export async function clearRecordings(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  if (Platform.OS === 'web') return;
  const { deleteAsync, documentDirectory } = fs();
  if (!documentDirectory) return;
  try {
    await deleteAsync(documentDirectory + RECORDINGS_DIRNAME, { idempotent: true });
  } catch (err) {
    console.warn('[audio-lab] failed to clear recordings directory', err);
  }
}
