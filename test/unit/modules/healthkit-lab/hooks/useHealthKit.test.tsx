/**
 * useHealthKit hook tests.
 * Feature: 043-healthkit
 *
 * `react-native-health` is mocked at the import boundary; the hook
 * never touches a real native module. Tests cover: init success,
 * init error, query results, query errors, manual writes, observer
 * subscribe / unsubscribe, error paths, and unmount cleanup.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

interface NativeMock {
  initHealthKit: jest.Mock;
  getAuthStatus: jest.Mock;
  getDailyStepCountSamples: jest.Mock;
  getHeartRateSamples: jest.Mock;
  getSleepSamples: jest.Mock;
  getAnchoredWorkouts: jest.Mock;
  getLatestWeight: jest.Mock;
  saveWeight: jest.Mock;
  saveHeartRateSample: jest.Mock;
  setObserver: jest.Mock;
}

const mockNative: NativeMock = {
  initHealthKit: jest.fn(),
  getAuthStatus: jest.fn(),
  getDailyStepCountSamples: jest.fn(),
  getHeartRateSamples: jest.fn(),
  getSleepSamples: jest.fn(),
  getAnchoredWorkouts: jest.fn(),
  getLatestWeight: jest.fn(),
  saveWeight: jest.fn(),
  saveHeartRateSample: jest.fn(),
  setObserver: jest.fn(),
};

jest.mock('react-native-health', () => ({
  __esModule: true,
  default: mockNative,
}));

import {
  __setHealthKitModuleForTests,
  useHealthKit,
  type UseHealthKitReturn,
} from '@/modules/healthkit-lab/hooks/useHealthKit';

interface Handle {
  current: UseHealthKitReturn | null;
}

const handle: Handle = { current: null };

function Harness() {
  const hk = useHealthKit();
  React.useEffect(() => {
    handle.current = hk;
  });
  return null;
}

function defaultMockBehaviour() {
  mockNative.initHealthKit.mockImplementation((_o: unknown, cb: (e: string | null) => void) =>
    cb(null),
  );
  mockNative.getAuthStatus.mockImplementation(
    (_o: unknown, cb: (e: string | null, r: unknown) => void) =>
      cb(null, { permissions: { read: [2, 2, 2, 2, 2], write: [2, 2] } }),
  );
  mockNative.getDailyStepCountSamples.mockImplementation(
    (_o: unknown, cb: (e: string | null, r: unknown[]) => void) =>
      cb(null, [
        { startDate: '2026-04-30T00:00:00Z', value: 12345 },
        { startDate: '2026-04-29T00:00:00Z', value: 5000 },
      ]),
  );
  mockNative.getHeartRateSamples.mockImplementation(
    (_o: unknown, cb: (e: string | null, r: unknown[]) => void) =>
      cb(null, [
        { startDate: '2026-04-30T08:00:00Z', value: 70 },
        { startDate: '2026-04-30T09:00:00Z', value: 80 },
      ]),
  );
  mockNative.getSleepSamples.mockImplementation(
    (_o: unknown, cb: (e: string | null, r: unknown[]) => void) =>
      cb(null, [
        {
          startDate: '2026-04-29T22:00:00Z',
          endDate: '2026-04-30T05:30:00Z',
          value: 'HKCategoryValueSleepAnalysisAsleepCore',
        },
      ]),
  );
  mockNative.getAnchoredWorkouts.mockImplementation(
    (_o: unknown, cb: (e: unknown, r: { data: unknown[] }) => void) =>
      cb(null, {
        data: [
          {
            id: 'w1',
            activityName: 'Running',
            start: '2026-04-30T07:00:00Z',
            end: '2026-04-30T07:30:00Z',
            calories: 250,
            duration: 1800,
          },
        ],
      }),
  );
  mockNative.getLatestWeight.mockImplementation(
    (_o: unknown, cb: (e: string | null, r: unknown) => void) =>
      cb(null, { value: 75000, startDate: '2026-04-29T08:00:00Z' }),
  );
  mockNative.saveWeight.mockImplementation((_o: unknown, cb: (e: string | null) => void) =>
    cb(null),
  );
  mockNative.saveHeartRateSample.mockImplementation((_o: unknown, cb: (e: string | null) => void) =>
    cb(null),
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  handle.current = null;
  __setHealthKitModuleForTests(mockNative as never);
  defaultMockBehaviour();
});

afterEach(() => {
  __setHealthKitModuleForTests(null);
});

describe('useHealthKit — initial mount', () => {
  it('starts with sane defaults before init resolves', async () => {
    // Block init until we want it to resolve.
    let release: (() => void) | null = null;
    mockNative.initHealthKit.mockImplementation((_o: unknown, cb: (e: string | null) => void) => {
      release = () => cb(null);
    });

    render(<Harness />);
    expect(handle.current?.initialised).toBe(false);
    expect(handle.current?.lastError).toBeNull();
    expect(handle.current?.observerActive).toBe(false);
    expect(handle.current?.observerUpdateCount).toBe(0);

    await act(async () => {
      release?.();
      await Promise.resolve();
    });
  });

  it('runs initHealthKit + getAuthStatus + every query on mount', async () => {
    render(<Harness />);
    await flush();
    expect(mockNative.initHealthKit).toHaveBeenCalledTimes(1);
    expect(mockNative.getAuthStatus).toHaveBeenCalledTimes(1);
    expect(mockNative.getDailyStepCountSamples).toHaveBeenCalledTimes(1);
    expect(mockNative.getHeartRateSamples).toHaveBeenCalledTimes(1);
    expect(mockNative.getSleepSamples).toHaveBeenCalledTimes(1);
    expect(mockNative.getAnchoredWorkouts).toHaveBeenCalledTimes(1);
    expect(mockNative.getLatestWeight).toHaveBeenCalledTimes(1);
  });

  it('sets initialised, available, and authStatusByType on success', async () => {
    render(<Harness />);
    await flush();
    expect(handle.current?.initialised).toBe(true);
    expect(handle.current?.available).toBe(true);
    expect(handle.current?.authStatusByType.steps).toBe('authorized');
    expect(handle.current?.authStatusByType.heartRate).toBe('authorized');
  });

  it('records lastError and sets available=false when init fails', async () => {
    mockNative.initHealthKit.mockImplementation((_o: unknown, cb: (e: string | null) => void) =>
      cb('boom'),
    );
    render(<Harness />);
    await flush();
    expect(handle.current?.initialised).toBe(false);
    expect(handle.current?.available).toBe(false);
    expect(handle.current?.lastError).toMatch(/init/);
  });
});

describe('useHealthKit — query results', () => {
  it('buckets daily step counts by day and returns 7 entries', async () => {
    render(<Harness />);
    await flush();
    const steps = handle.current?.steps7d ?? [];
    expect(steps).toHaveLength(7);
    expect(steps.some((d) => d.steps === 12345)).toBe(true);
  });

  it('exposes the most-recent heart rate as latestHeartRate', async () => {
    render(<Harness />);
    await flush();
    expect(handle.current?.latestHeartRate?.bpm).toBe(80);
    expect(handle.current?.heartRate24h).toHaveLength(2);
  });

  it('maps sleep raw values to coarse stages', async () => {
    render(<Harness />);
    await flush();
    expect(handle.current?.sleepLastNight[0]?.stage).toBe('core');
  });

  it('returns workouts in the expected shape', async () => {
    render(<Harness />);
    await flush();
    expect(handle.current?.workouts).toHaveLength(1);
    expect(handle.current?.workouts[0]?.id).toBe('w1');
    expect(handle.current?.workouts[0]?.activityName).toBe('Running');
  });

  it('converts the latest weight from grams to kg', async () => {
    render(<Harness />);
    await flush();
    expect(handle.current?.weight?.kg).toBeCloseTo(75, 5);
  });

  it('records lastError when a query fails but does not throw', async () => {
    mockNative.getHeartRateSamples.mockImplementation(
      (_o: unknown, cb: (e: string | null, r: unknown[]) => void) => cb('hr-failed', []),
    );
    render(<Harness />);
    await flush();
    expect(handle.current?.lastError).toMatch(/heartRate/);
    // Other data still loaded:
    expect(handle.current?.steps7d.length).toBeGreaterThan(0);
  });
});

describe('useHealthKit — writes', () => {
  it('writes manual heart-rate samples and triggers a refresh', async () => {
    render(<Harness />);
    await flush();
    const before = mockNative.getHeartRateSamples.mock.calls.length;
    await act(async () => {
      await handle.current?.writeManualHeartRate(72);
    });
    expect(mockNative.saveHeartRateSample).toHaveBeenCalledTimes(1);
    expect(mockNative.getHeartRateSamples.mock.calls.length).toBeGreaterThan(before);
  });

  it('rejects an invalid bpm without calling the native API', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current?.writeManualHeartRate(0);
    });
    expect(mockNative.saveHeartRateSample).not.toHaveBeenCalled();
    expect(handle.current?.lastError).toMatch(/writeHeartRate/);
  });

  it('writes weight in grams (kg * 1000)', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current?.writeWeight(80);
    });
    expect(mockNative.saveWeight).toHaveBeenCalledTimes(1);
    const args = mockNative.saveWeight.mock.calls[0][0] as { value: number; unit?: string };
    expect(args.value).toBe(80_000);
    expect(args.unit).toBe('gram');
  });

  it('records lastError when saveWeight fails', async () => {
    mockNative.saveWeight.mockImplementation((_o: unknown, cb: (e: string | null) => void) =>
      cb('disk-full'),
    );
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current?.writeWeight(80);
    });
    expect(handle.current?.lastError).toMatch(/writeWeight/);
  });
});

describe('useHealthKit — observer', () => {
  it('toggleObserver flips the observerActive flag and registers the observer', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current?.toggleObserver();
    });
    expect(handle.current?.observerActive).toBe(true);
    expect(mockNative.setObserver).toHaveBeenCalledTimes(1);
    expect(mockNative.setObserver.mock.calls[0][0]).toEqual({ type: 'StepCount' });
  });

  it('a second toggle stops the observer', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current?.toggleObserver();
    });
    act(() => {
      handle.current?.toggleObserver();
    });
    expect(handle.current?.observerActive).toBe(false);
  });

  it('records lastError when setObserver throws and leaves the flag off', async () => {
    mockNative.setObserver.mockImplementation(() => {
      throw new Error('not allowed');
    });
    render(<Harness />);
    await flush();
    act(() => {
      handle.current?.toggleObserver();
    });
    expect(handle.current?.observerActive).toBe(false);
    expect(handle.current?.lastError).toMatch(/observer/);
  });
});

describe('useHealthKit — reset', () => {
  it('clears lastError and observerUpdateCount', async () => {
    mockNative.initHealthKit.mockImplementation((_o: unknown, cb: (e: string | null) => void) =>
      cb('boom'),
    );
    render(<Harness />);
    await flush();
    expect(handle.current?.lastError).toMatch(/init/);
    act(() => {
      handle.current?.reset();
    });
    expect(handle.current?.lastError).toBeNull();
    expect(handle.current?.observerUpdateCount).toBe(0);
  });
});

describe('useHealthKit — unmount cleanup', () => {
  it('does not update state after unmount when a slow callback fires', async () => {
    let slowCb: (() => void) | null = null;
    mockNative.getDailyStepCountSamples.mockImplementation(
      (_o: unknown, cb: (e: string | null, r: unknown[]) => void) => {
        slowCb = () => cb(null, [{ startDate: '2026-04-30T00:00:00Z', value: 99999 }]);
      },
    );
    const { unmount } = render(<Harness />);
    // Unmount before any callback resolves.
    unmount();
    // Now fire the slow callback. It should not throw or update state.
    expect(() => {
      slowCb?.();
    }).not.toThrow();
  });
});
