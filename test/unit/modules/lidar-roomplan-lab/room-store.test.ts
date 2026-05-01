/**
 * @jest-environment node
 *
 * room-store tests — pure helpers + AsyncStorage round-trip.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EMPTY_ROOMS,
  STORAGE_KEY,
  type ScannedRoom,
  addRoom,
  load,
  parsePersisted,
  removeRoom,
  save,
  updateRoom,
} from '@/modules/lidar-roomplan-lab/room-store';

const sampleRoom: ScannedRoom = {
  id: 'room-1',
  name: 'Office',
  dimensions: { widthM: 3, lengthM: 4, heightM: 2.5 },
  surfaces: { walls: 4, windows: 2, doors: 1, openings: 1, objects: 6 },
  createdAt: '2026-05-12T00:00:00.000Z',
  usdzPath: null,
};

describe('room-store: STORAGE_KEY', () => {
  it('uses the documented namespace key', () => {
    expect(STORAGE_KEY).toBe('spot.roomplan.rooms');
  });
});

describe('room-store: parsePersisted', () => {
  it('null → EMPTY_ROOMS without onError', () => {
    const onError = jest.fn();
    expect(parsePersisted(null, { onError })).toEqual(EMPTY_ROOMS);
    expect(onError).not.toHaveBeenCalled();
  });

  it('invalid JSON → EMPTY_ROOMS and reports onError', () => {
    const onError = jest.fn();
    expect(parsePersisted('{not json', { onError })).toEqual(EMPTY_ROOMS);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('non-array payload → EMPTY_ROOMS and reports onError', () => {
    const onError = jest.fn();
    expect(parsePersisted(JSON.stringify({ rooms: [] }), { onError })).toEqual(EMPTY_ROOMS);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('drops invalid entries silently', () => {
    const raw = JSON.stringify([
      sampleRoom,
      { id: 'bad', name: 'Bad' }, // missing fields
      'not an object',
      null,
    ]);
    const out = parsePersisted(raw);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('room-1');
  });

  it('preserves a fully-valid array', () => {
    const raw = JSON.stringify([sampleRoom]);
    const out = parsePersisted(raw);
    expect(out).toEqual([sampleRoom]);
  });

  it('rejects rows with non-finite numeric fields', () => {
    const broken = {
      ...sampleRoom,
      dimensions: { widthM: Number.NaN, lengthM: 4, heightM: 2.5 },
    };
    const out = parsePersisted(JSON.stringify([broken]));
    expect(out).toEqual([]);
  });
});

describe('room-store: addRoom / removeRoom / updateRoom', () => {
  it('addRoom prepends and returns a new array', () => {
    const out = addRoom(EMPTY_ROOMS, sampleRoom);
    expect(out).toEqual([sampleRoom]);
    expect(out).not.toBe(EMPTY_ROOMS);
  });

  it('removeRoom drops the matching id', () => {
    const out = removeRoom([sampleRoom], 'room-1');
    expect(out).toEqual([]);
  });

  it('removeRoom is a no-op when the id is absent', () => {
    const out = removeRoom([sampleRoom], 'unknown');
    expect(out).toEqual([sampleRoom]);
  });

  it('updateRoom merges patch onto the matching room only', () => {
    const second: ScannedRoom = { ...sampleRoom, id: 'room-2', name: 'Kitchen' };
    const list = [sampleRoom, second];
    const out = updateRoom(list, 'room-2', { usdzPath: 'file:///tmp/k.usdz' });
    expect(out[0]).toEqual(sampleRoom);
    expect(out[1].usdzPath).toBe('file:///tmp/k.usdz');
    expect(out[1].id).toBe('room-2');
  });

  it('updateRoom is a no-op for an unknown id', () => {
    const out = updateRoom([sampleRoom], 'unknown', { usdzPath: 'x' });
    expect(out).toEqual([sampleRoom]);
  });
});

describe('room-store: load / save round trip (AsyncStorage)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('save then load returns a structurally-equal array', async () => {
    await save([sampleRoom]);
    const loaded = await load();
    expect(loaded).toEqual([sampleRoom]);
  });

  it('load returns EMPTY_ROOMS when nothing has been persisted', async () => {
    const loaded = await load();
    expect(loaded).toEqual(EMPTY_ROOMS);
  });

  it('load reports onError and returns EMPTY_ROOMS when AsyncStorage rejects', async () => {
    const onError = jest.fn();
    const original = AsyncStorage.getItem;
    (AsyncStorage as { getItem: typeof AsyncStorage.getItem }).getItem = jest.fn(() =>
      Promise.reject(new Error('disk full')),
    );
    try {
      const out = await load({ onError });
      expect(out).toEqual(EMPTY_ROOMS);
      expect(onError).toHaveBeenCalledTimes(1);
    } finally {
      (AsyncStorage as { getItem: typeof AsyncStorage.getItem }).getItem = original;
    }
  });

  it('save serialises through JSON.stringify (sanity)', async () => {
    await save([sampleRoom]);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(typeof raw).toBe('string');
    expect(JSON.parse(raw as string)).toEqual([sampleRoom]);
  });
});
