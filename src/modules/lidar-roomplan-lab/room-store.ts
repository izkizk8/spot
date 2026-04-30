/**
 * room-store — AsyncStorage-backed persistence of LiDAR /
 * RoomPlan scan metadata (feature 048).
 *
 * The store retains scan metadata and the on-disk USDZ file path
 * (when the export step has run). The native bridge owns the
 * binary asset; we never copy bytes through JS.
 *
 * Pure helpers (`parsePersisted`, `addRoom`, `removeRoom`,
 * `updateRoom`) are testable without a real AsyncStorage; the
 * side-effectful `load` and `save` are thin wrappers around
 * `AsyncStorage.getItem` / `setItem`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RoomDimensions, SurfaceCounts } from '@/native/roomplan.types';

export const STORAGE_KEY = 'spot.roomplan.rooms' as const;

export interface ScannedRoom {
  readonly id: string;
  readonly name: string;
  readonly dimensions: RoomDimensions;
  readonly surfaces: SurfaceCounts;
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
  /** On-disk URI of the persisted USDZ asset, or null if not yet exported. */
  readonly usdzPath: string | null;
}

export const EMPTY_ROOMS: readonly ScannedRoom[] = Object.freeze([]);

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function isDimensions(value: unknown): value is RoomDimensions {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;
  return isFiniteNumber(d.widthM) && isFiniteNumber(d.lengthM) && isFiniteNumber(d.heightM);
}

function isSurfaceCounts(value: unknown): value is SurfaceCounts {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    isFiniteNumber(s.walls) &&
    isFiniteNumber(s.windows) &&
    isFiniteNumber(s.doors) &&
    isFiniteNumber(s.openings) &&
    isFiniteNumber(s.objects)
  );
}

function isScannedRoom(value: unknown): value is ScannedRoom {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.createdAt === 'string' &&
    (r.usdzPath === null || typeof r.usdzPath === 'string') &&
    isDimensions(r.dimensions) &&
    isSurfaceCounts(r.surfaces)
  );
}

/**
 * Pure parser — tolerates corrupt JSON, bad shapes, and
 * row-level invalidity. Bad rows are silently dropped; the
 * caller can opt in to error reporting via `onError`.
 */
export function parsePersisted(
  raw: string | null,
  opts?: { readonly onError?: (err: unknown) => void },
): readonly ScannedRoom[] {
  if (raw === null) return EMPTY_ROOMS;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    opts?.onError?.(cause);
    return EMPTY_ROOMS;
  }
  if (!Array.isArray(parsed)) {
    opts?.onError?.(new Error('roomplan store: expected array'));
    return EMPTY_ROOMS;
  }
  const out: ScannedRoom[] = [];
  for (const item of parsed) {
    if (isScannedRoom(item)) {
      out.push(item);
    }
  }
  return out;
}

export async function load(opts?: {
  readonly onError?: (err: unknown) => void;
}): Promise<readonly ScannedRoom[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return parsePersisted(raw, opts);
  } catch (cause) {
    opts?.onError?.(cause);
    return EMPTY_ROOMS;
  }
}

export async function save(rooms: readonly ScannedRoom[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

/** Returns a NEW array with `room` prepended. */
export function addRoom(rooms: readonly ScannedRoom[], room: ScannedRoom): readonly ScannedRoom[] {
  return [room, ...rooms];
}

/** Returns a NEW array with the matching id removed. */
export function removeRoom(rooms: readonly ScannedRoom[], id: string): readonly ScannedRoom[] {
  return rooms.filter((r) => r.id !== id);
}

/**
 * Returns a NEW array with the matching room replaced by
 * `{ ...current, ...patch }`. No-op when the id is absent.
 */
export function updateRoom(
  rooms: readonly ScannedRoom[],
  id: string,
  patch: Partial<Omit<ScannedRoom, 'id'>>,
): readonly ScannedRoom[] {
  return rooms.map((r) => (r.id === id ? { ...r, ...patch } : r));
}
