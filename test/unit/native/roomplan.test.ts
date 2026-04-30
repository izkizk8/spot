/**
 * @jest-environment node
 *
 * Bridge contract tests for `src/native/roomplan.ts` and the
 * Android / Web variants. Validates the JS surface without
 * loading the iOS native module.
 */

import {
  RoomPlanNotSupported,
  SCAN_PHASES,
  ZERO_DIMENSIONS,
  ZERO_SURFACES,
} from '@/native/roomplan.types';

describe('roomplan.types', () => {
  it('exports the canonical phase catalog', () => {
    expect(SCAN_PHASES).toEqual(['idle', 'scanning', 'processing', 'completed', 'error']);
  });

  it('SCAN_PHASES is frozen', () => {
    expect(Object.isFrozen(SCAN_PHASES)).toBe(true);
  });

  it('ZERO_DIMENSIONS and ZERO_SURFACES are frozen zero-records', () => {
    expect(Object.isFrozen(ZERO_DIMENSIONS)).toBe(true);
    expect(Object.isFrozen(ZERO_SURFACES)).toBe(true);
    expect(ZERO_DIMENSIONS).toEqual({ widthM: 0, lengthM: 0, heightM: 0 });
    expect(ZERO_SURFACES).toEqual({
      walls: 0,
      windows: 0,
      doors: 0,
      openings: 0,
      objects: 0,
    });
  });

  it('RoomPlanNotSupported has the documented code and name', () => {
    const e = new RoomPlanNotSupported();
    expect(e.code).toBe('ROOMPLAN_NOT_SUPPORTED');
    expect(e.name).toBe('RoomPlanNotSupported');
    expect(e).toBeInstanceOf(Error);
  });
});

describe('roomplan.android', () => {
  let android: typeof import('@/native/roomplan.android');

  beforeAll(() => {
    android = require('@/native/roomplan.android');
  });

  it('isSupported is false', () => {
    expect(android.isSupported()).toBe(false);
  });

  it('startCapture rejects with RoomPlanNotSupported', async () => {
    await expect(android.startCapture()).rejects.toBeInstanceOf(RoomPlanNotSupported);
  });

  it('stopCapture rejects with RoomPlanNotSupported', async () => {
    await expect(android.stopCapture()).rejects.toBeInstanceOf(RoomPlanNotSupported);
  });

  it('exportUSDZ rejects with RoomPlanNotSupported', async () => {
    await expect(android.exportUSDZ('any-id')).rejects.toBeInstanceOf(RoomPlanNotSupported);
  });

  it('subscribe is a no-op returning an unsubscribe function', () => {
    const unsubscribe = android.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('default export aggregates the surface', () => {
    expect(typeof android.default.isSupported).toBe('function');
    expect(typeof android.default.startCapture).toBe('function');
    expect(typeof android.default.stopCapture).toBe('function');
    expect(typeof android.default.exportUSDZ).toBe('function');
    expect(typeof android.default.subscribe).toBe('function');
  });
});

describe('roomplan.web', () => {
  let web: typeof import('@/native/roomplan.web');

  beforeAll(() => {
    web = require('@/native/roomplan.web');
  });

  it('isSupported is false', () => {
    expect(web.isSupported()).toBe(false);
  });

  it('startCapture rejects with RoomPlanNotSupported', async () => {
    await expect(web.startCapture()).rejects.toBeInstanceOf(RoomPlanNotSupported);
  });

  it('stopCapture rejects with RoomPlanNotSupported', async () => {
    await expect(web.stopCapture()).rejects.toBeInstanceOf(RoomPlanNotSupported);
  });

  it('exportUSDZ rejects with RoomPlanNotSupported', async () => {
    await expect(web.exportUSDZ('any-id')).rejects.toBeInstanceOf(RoomPlanNotSupported);
  });

  it('subscribe is a no-op returning an unsubscribe function', () => {
    const unsubscribe = web.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});

describe('roomplan (iOS variant) — null-safe when native module absent', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({
      requireOptionalNativeModule: () => null,
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('isSupported returns false when native module is missing', () => {
    const ios = require('@/native/roomplan');
    expect(ios.isSupported()).toBe(false);
  });

  it('startCapture rejects with RoomPlanNotSupported when native module is missing', async () => {
    const ios = require('@/native/roomplan');
    await expect(ios.startCapture()).rejects.toMatchObject({
      code: 'ROOMPLAN_NOT_SUPPORTED',
      name: 'RoomPlanNotSupported',
    });
  });

  it('exportUSDZ rejects with RoomPlanNotSupported when native module is missing', async () => {
    const ios = require('@/native/roomplan');
    await expect(ios.exportUSDZ('id')).rejects.toMatchObject({
      code: 'ROOMPLAN_NOT_SUPPORTED',
      name: 'RoomPlanNotSupported',
    });
  });

  it('subscribe is a no-op when native module is missing', () => {
    const ios = require('@/native/roomplan');
    const unsubscribe = ios.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});

describe('roomplan (iOS variant) — delegates to a present native module', () => {
  const native = {
    isSupported: jest.fn(() => true),
    startCapture: jest.fn(async () => ({
      id: 'r1',
      name: 'Room',
      dimensions: { widthM: 1, lengthM: 2, heightM: 3 },
      surfaces: { walls: 4, windows: 1, doors: 1, openings: 0, objects: 2 },
      createdAt: '2026-05-12T00:00:00.000Z',
      usdzPath: null,
    })),
    stopCapture: jest.fn(async () => undefined),
    exportUSDZ: jest.fn(async (id: string) => `file:///tmp/${id}.usdz`),
    addPhaseListener: jest.fn((cb: (phase: string) => void) => {
      // Synchronously emit a phase to validate routing.
      cb('scanning');
      return { remove: jest.fn() };
    }),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({
      requireOptionalNativeModule: () => native,
    }));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('isSupported delegates to the native module', () => {
    const ios = require('@/native/roomplan');
    expect(ios.isSupported()).toBe(true);
    expect(native.isSupported).toHaveBeenCalled();
  });

  it('startCapture delegates and forwards the result', async () => {
    const ios = require('@/native/roomplan');
    const result = await ios.startCapture();
    expect(native.startCapture).toHaveBeenCalled();
    expect(result.id).toBe('r1');
  });

  it('stopCapture delegates to the native module', async () => {
    const ios = require('@/native/roomplan');
    await ios.stopCapture();
    expect(native.stopCapture).toHaveBeenCalled();
  });

  it('exportUSDZ forwards the roomId and returns the path', async () => {
    const ios = require('@/native/roomplan');
    const path = await ios.exportUSDZ('roomA');
    expect(native.exportUSDZ).toHaveBeenCalledWith('roomA');
    expect(path).toBe('file:///tmp/roomA.usdz');
  });

  it('subscribe routes phase events from the native listener', () => {
    const ios = require('@/native/roomplan');
    const cb = jest.fn();
    const unsubscribe = ios.subscribe(cb);
    expect(native.addPhaseListener).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith('scanning');
    unsubscribe();
  });
});
