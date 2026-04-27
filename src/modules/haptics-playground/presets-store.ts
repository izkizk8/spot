import AsyncStorage from '@react-native-async-storage/async-storage';

import { PresetsStoreError, type Cell, type Pattern, type Preset } from './types';

const KEY = 'spot.haptics.presets';

const isCell = (v: unknown): v is Cell => {
  if (!v || typeof v !== 'object') return false;
  const k = (v as { kind?: unknown }).kind;
  if (k === 'off') return true;
  if (k === 'impact' || k === 'notification') {
    return typeof (v as { intensity?: unknown }).intensity === 'string';
  }
  return false;
};

const isPattern = (v: unknown): v is Pattern =>
  Array.isArray(v) && v.length === 8 && v.every(isCell);

const isPreset = (v: unknown): v is Preset => {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.createdAt === 'string' &&
    isPattern(o.pattern)
  );
};

const isAllOff = (p: Pattern): boolean => p.every((c) => c.kind === 'off');

const randomSuffix = (n = 6): string =>
  Math.random()
    .toString(36)
    .slice(2, 2 + n)
    .padEnd(n, '0');

const makeId = (): string => `${Date.now()}-${randomSuffix(6)}`;

const smallestFreeInt = (presets: Preset[]): number => {
  const used = new Set<number>();
  for (const p of presets) {
    const m = /^Preset (\d+)$/.exec(p.name);
    if (m) used.add(Number(m[1]));
  }
  let i = 1;
  while (used.has(i)) i++;
  return i;
};

export async function list(): Promise<Preset[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPreset);
  } catch {
    return [];
  }
}

async function writeAll(presets: Preset[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(presets));
  } catch (err) {
    throw new PresetsStoreError(
      'write-failed',
      `Failed to persist presets: ${(err as Error)?.message ?? 'unknown'}`,
    );
  }
}

export async function save(pattern: Pattern): Promise<Preset> {
  if (isAllOff(pattern)) {
    throw new PresetsStoreError('empty-pattern', 'Cannot save an all-off pattern.');
  }
  const existing = await list();
  const preset: Preset = {
    id: makeId(),
    name: `Preset ${smallestFreeInt(existing)}`,
    pattern,
    createdAt: new Date().toISOString(),
  };
  await writeAll([...existing, preset]);
  return preset;
}

export async function deletePreset(id: string): Promise<void> {
  const existing = await list();
  const next = existing.filter((p) => p.id !== id);
  if (next.length === existing.length) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // delete is best-effort per contract
  }
}
