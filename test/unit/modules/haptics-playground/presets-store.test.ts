import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { list, save, deletePreset } from '@/modules/haptics-playground/presets-store';
import { PresetsStoreError, type Cell, type Pattern } from '@/modules/haptics-playground/types';

const OFF: Cell = { kind: 'off' };
const allOff: Pattern = [OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF];
const samplePattern = (): Pattern =>
  [
    { kind: 'impact', intensity: 'light' },
    OFF,
    { kind: 'notification', intensity: 'success' },
    OFF,
    OFF,
    OFF,
    OFF,
    OFF,
  ] as unknown as Pattern;

const KEY = 'spot.haptics.presets';

describe('presets-store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('list() on empty returns []', async () => {
    expect(await list()).toEqual([]);
  });

  it('save then list returns the preset', async () => {
    const p = await save(samplePattern());
    expect(p.name).toBe('Preset 1');
    const all = await list();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(p.id);
  });

  it('reuses smallest free integer name after delete', async () => {
    const a = await save(samplePattern());
    const b = await save(samplePattern());
    const c = await save(samplePattern());
    expect([a.name, b.name, c.name]).toEqual(['Preset 1', 'Preset 2', 'Preset 3']);

    await deletePreset(b.id);
    const d = await save(samplePattern());
    expect(d.name).toBe('Preset 2');
  });

  it('returns [] on corrupted JSON', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    expect(await list()).toEqual([]);
  });

  it('filters invalid entries from a partially valid array', async () => {
    const validPreset = {
      id: 'abc',
      name: 'Preset 1',
      pattern: samplePattern(),
      createdAt: new Date().toISOString(),
    };
    const blob = JSON.stringify([validPreset, { not: 'a preset' }, null, 42]);
    await AsyncStorage.setItem(KEY, blob);
    const all = await list();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe('abc');
  });

  it('save rejects all-off pattern with empty-pattern code', async () => {
    await expect(save(allOff)).rejects.toBeInstanceOf(PresetsStoreError);
    await expect(save(allOff)).rejects.toMatchObject({ code: 'empty-pattern' });
  });

  it('save throws write-failed when AsyncStorage.setItem rejects', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(save(samplePattern())).rejects.toMatchObject({ code: 'write-failed' });
  });

  it('deletePreset on unknown id resolves silently', async () => {
    await expect(deletePreset('nope')).resolves.toBeUndefined();
  });
});
