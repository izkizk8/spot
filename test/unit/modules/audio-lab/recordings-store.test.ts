/**
 * T016: Recordings store CRUD + parse tolerance (feature 020).
 *
 * data-model §9 + R-003 + R-009 + FR-013/017/032/033/034.
 */

import { Platform } from 'react-native';

import type { Recording } from '@/modules/audio-lab/audio-types';
import {
  clearRecordings,
  deleteRecording,
  loadRecordings,
  saveRecording,
  STORAGE_KEY,
} from '@/modules/audio-lab/recordings-store';

// Use the controllable in-memory AsyncStorage from test/setup.ts —
// access raw module to call its `__INTERNAL_MOCK_STORAGE` reset shim.
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-file-system');
jest.mock('expo-file-system/legacy', () => jest.requireMock('expo-file-system'));

const fs = jest.requireMock('expo-file-system') as typeof import('../../../__mocks__/expo-file-system');

function makeRecording(over: Partial<Recording> = {}): Recording {
  return {
    id: 'id-' + Math.random().toString(36).slice(2),
    name: '2026-04-28-12-00-00.m4a',
    uri: fs.documentDirectory + 'recordings/2026-04-28-12-00-00.m4a',
    durationMs: 1000,
    sizeBytes: 4096,
    createdAt: '2026-04-28T12:00:00.000Z',
    quality: 'Medium',
    ...over,
  };
}

describe('recordings-store', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    fs.__reset();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // loadRecordings
  // -------------------------------------------------------------------------

  describe('loadRecordings()', () => {
    it('returns [] on missing key (no warn)', async () => {
      const list = await loadRecordings();
      expect(list).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('returns [] and warns once on JSON parse failure (FR-034)', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, '{not-json');
      const list = await loadRecordings();
      expect(list).toEqual([]);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('returns parsed array preserving insertion order on valid JSON', async () => {
      const a = makeRecording({ id: 'a', name: 'a.m4a', uri: 'file:///a.m4a' });
      const b = makeRecording({ id: 'b', name: 'b.m4a', uri: 'file:///b.m4a' });
      fs.__setExists('file:///a.m4a', true, 100);
      fs.__setExists('file:///b.m4a', true, 200);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([a, b]));
      const list = await loadRecordings();
      expect(list.map((r) => r.id)).toEqual(['a', 'b']);
    });

    it('filters out entries whose uri does not exist on disk and re-persists (FR-017)', async () => {
      const present = makeRecording({ id: 'p', uri: 'file:///present.m4a' });
      const missing = makeRecording({ id: 'm', uri: 'file:///gone.m4a' });
      fs.__setExists('file:///present.m4a', true, 100);
      fs.__setExists('file:///gone.m4a', false);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([present, missing]));

      const list = await loadRecordings();
      expect(list.map((r) => r.id)).toEqual(['p']);
      expect(warnSpy).toHaveBeenCalledTimes(1); // one warn per dropped entry

      const persisted = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '[]');
      expect(persisted.map((r: Recording) => r.id)).toEqual(['p']);
    });

    it('on Web, skips on-disk existence check', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      const r = makeRecording({ id: 'w', uri: 'blob:fake-url' });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([r]));
      const list = await loadRecordings();
      expect(list.map((x) => x.id)).toEqual(['w']);
      expect(fs.getInfoAsync).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // saveRecording
  // -------------------------------------------------------------------------

  describe('saveRecording()', () => {
    it('appends to current list, persists, returns new list', async () => {
      const a = makeRecording({ id: 'a', name: 'a.m4a', uri: 'file:///a.m4a' });
      fs.__setExists('file:///a.m4a', true, 100);
      const list = await saveRecording(a);
      expect(list.map((r) => r.id)).toEqual(['a']);
      const persisted = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '[]');
      expect(persisted).toHaveLength(1);
    });

    it('de-duplicates name collisions by appending -1, -2 before .m4a (R-003)', async () => {
      fs.__setExists('file:///x.m4a', true, 100);
      const a = makeRecording({ id: 'a', name: '2026-04-28-12-00-00.m4a' });
      const b = makeRecording({ id: 'b', name: '2026-04-28-12-00-00.m4a' });
      const c = makeRecording({ id: 'c', name: '2026-04-28-12-00-00.m4a' });
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      await saveRecording(a);
      const after2 = await saveRecording(b);
      const after3 = await saveRecording(c);
      expect(after2.map((r) => r.name)).toEqual([
        '2026-04-28-12-00-00.m4a',
        '2026-04-28-12-00-00-1.m4a',
      ]);
      expect(after3.map((r) => r.name)).toEqual([
        '2026-04-28-12-00-00.m4a',
        '2026-04-28-12-00-00-1.m4a',
        '2026-04-28-12-00-00-2.m4a',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // deleteRecording
  // -------------------------------------------------------------------------

  describe('deleteRecording()', () => {
    it('removes by id (not by name) and calls FileSystem.deleteAsync({ idempotent: true })', async () => {
      const a = makeRecording({ id: 'a', name: 'shared.m4a', uri: 'file:///a.m4a' });
      const b = makeRecording({ id: 'b', name: 'shared.m4a', uri: 'file:///b.m4a' });
      fs.__setExists('file:///a.m4a', true);
      fs.__setExists('file:///b.m4a', true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([a, b]));

      const list = await deleteRecording('a');
      expect(list.map((r) => r.id)).toEqual(['b']);
      expect(fs.deleteAsync).toHaveBeenCalledWith('file:///a.m4a', { idempotent: true });
    });

    it('on Web, does not call FileSystem.deleteAsync', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      const a = makeRecording({ id: 'a', uri: 'blob:fake' });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([a]));
      await deleteRecording('a');
      expect(fs.deleteAsync).not.toHaveBeenCalled();
    });

    it('is a no-op for an unknown id', async () => {
      const list = await deleteRecording('nope');
      expect(list).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // clearRecordings
  // -------------------------------------------------------------------------

  describe('clearRecordings()', () => {
    it('removes the AsyncStorage key and recursively deletes the recordings directory', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([makeRecording()]));
      await clearRecordings();
      expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(fs.deleteAsync).toHaveBeenCalledWith(
        fs.documentDirectory + 'recordings',
        { idempotent: true },
      );
    });

    it('on Web, only clears the AsyncStorage key (no FileSystem call)', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([makeRecording()]));
      await clearRecordings();
      expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(fs.deleteAsync).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Error contract (FR-034)
  // -------------------------------------------------------------------------

  describe('never throws AudioStorageCorrupt to caller (FR-034)', () => {
    it('parse failure resolves with [] instead of throwing', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, 'garbage');
      await expect(loadRecordings()).resolves.toEqual([]);
    });
  });
});
