/**
 * useHealthKit — feature 043 / HealthKit Lab.
 *
 * Wraps the `react-native-health` callback API into a React-friendly
 * state machine. Owns:
 *   - the auth-status map (per HealthSampleId);
 *   - the cached query results for each card;
 *   - the optional HKObserverQuery subscription + update counter.
 *
 * Contracts:
 *   - `init()` runs `initHealthKit` and updates `authStatusByType`. On
 *     success, `refreshAll()` is called automatically.
 *   - All query / write helpers are no-throw: errors surface via
 *     `lastError`. Tests assert this contract.
 *   - The hook tears the observer down on unmount and ignores all
 *     `react-native-health` callbacks that resolve after unmount
 *     (an internal `aliveRef` guards every state update).
 *   - The native module is loaded lazily inside `getNativeModule()` so
 *     simply importing the hook does not require the native bridge.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type AuthStatus,
  type DailyStep,
  type HealthSampleId,
  type HeartRateSample,
  READ_PERMISSIONS,
  WRITE_PERMISSIONS,
  type SleepSegment,
  type WeightSample,
  type WorkoutSummary,
  lastNDates,
  makeInitialAuthMap,
  mapSleepValue,
} from '../sample-types';

interface NativeAuthStatusResult {
  permissions?: {
    read?: number[];
    write?: number[];
  };
}

interface NativeHealthValue {
  value: number;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

interface NativeWorkoutValue {
  id?: string;
  activityName?: string;
  start?: string;
  end?: string;
  calories?: number;
  duration?: number;
}

interface NativeAppleHealthKit {
  initHealthKit(
    options: {
      permissions: { read: readonly string[]; write: readonly string[] };
    },
    cb: (err: string | null) => void,
  ): void;
  getAuthStatus(
    options: {
      permissions: { read: readonly string[]; write: readonly string[] };
    },
    cb: (err: string | null, result: NativeAuthStatusResult) => void,
  ): void;
  getDailyStepCountSamples(
    options: { startDate: string; endDate: string },
    cb: (err: string | null, results: NativeHealthValue[]) => void,
  ): void;
  getHeartRateSamples(
    options: { startDate: string; endDate: string; limit?: number },
    cb: (err: string | null, results: NativeHealthValue[]) => void,
  ): void;
  getSleepSamples(
    options: { startDate: string; endDate: string; limit?: number },
    cb: (
      err: string | null,
      results: { startDate?: string; endDate?: string; value?: string }[],
    ) => void,
  ): void;
  getAnchoredWorkouts(
    options: { startDate: string; endDate: string; limit?: number },
    cb: (err: unknown, results: { data?: NativeWorkoutValue[] }) => void,
  ): void;
  getLatestWeight(
    options: { unit?: string },
    cb: (err: string | null, result: NativeHealthValue) => void,
  ): void;
  saveHeartRateSample?: (
    options: { value: number; startDate: string; endDate: string },
    cb: (err: string | null) => void,
  ) => void;
  saveWeight(options: { value: number; unit?: string }, cb: (err: string | null) => void): void;
  setObserver(options: { type: string }): void;
  Constants?: {
    Permissions?: Record<string, string>;
    Observers?: Record<string, string>;
  };
}

let cachedModule: NativeAppleHealthKit | null = null;

function getNativeModule(): NativeAppleHealthKit {
  if (cachedModule !== null) return cachedModule;
  const mod = require('react-native-health');
  cachedModule = (mod && (mod.default ?? mod)) as NativeAppleHealthKit;
  return cachedModule;
}

/**
 * Test-only seam to swap the cached module. Production code never uses
 * this; tests inject a fully-mocked native object before render.
 */
export function __setHealthKitModuleForTests(mod: NativeAppleHealthKit | null): void {
  cachedModule = mod;
}

export interface UseHealthKitReturn {
  readonly available: boolean | null;
  readonly initialised: boolean;
  readonly authStatusByType: Readonly<Record<HealthSampleId, AuthStatus>>;
  readonly steps7d: readonly DailyStep[];
  readonly heartRate24h: readonly HeartRateSample[];
  readonly latestHeartRate: HeartRateSample | null;
  readonly sleepLastNight: readonly SleepSegment[];
  readonly workouts: readonly WorkoutSummary[];
  readonly weight: WeightSample | null;
  readonly observerActive: boolean;
  readonly observerUpdateCount: number;
  readonly lastError: string | null;
  init(): Promise<void>;
  refreshAll(): Promise<void>;
  writeManualHeartRate(bpm: number): Promise<void>;
  writeWeight(kg: number): Promise<void>;
  toggleObserver(): void;
  reset(): void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * DAY_MS;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function bucketStepsByDay(
  results: readonly NativeHealthValue[],
  endIso: string,
): readonly DailyStep[] {
  const buckets = new Map<string, number>();
  for (const r of results) {
    const ds = r.startDate ?? r.endDate;
    if (typeof ds !== 'string') continue;
    const key = ds.slice(0, 10);
    const prev = buckets.get(key) ?? 0;
    const v = Number.isFinite(r.value) ? r.value : 0;
    buckets.set(key, prev + v);
  }
  const days = lastNDates(7, endIso);
  return Object.freeze(
    days.map<DailyStep>((d) => ({ date: d, steps: Math.round(buckets.get(d) ?? 0) })),
  );
}

function toHeartRateSamples(results: readonly NativeHealthValue[]): readonly HeartRateSample[] {
  const out: HeartRateSample[] = [];
  for (const r of results) {
    const ts = r.startDate ?? r.endDate;
    if (typeof ts !== 'string') continue;
    if (!Number.isFinite(r.value)) continue;
    out.push({ bpm: Math.round(r.value), timestamp: ts });
  }
  // Sort ascending by timestamp for sparkline rendering.
  out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return Object.freeze(out);
}

function toSleepSegments(
  results: readonly { startDate?: string; endDate?: string; value?: string }[],
): readonly SleepSegment[] {
  const out: SleepSegment[] = [];
  for (const r of results) {
    if (typeof r.startDate !== 'string' || typeof r.endDate !== 'string') continue;
    const start = new Date(r.startDate).getTime();
    const end = new Date(r.endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    out.push({
      stage: mapSleepValue(typeof r.value === 'string' ? r.value : 'asleep'),
      startDate: r.startDate,
      endDate: r.endDate,
      minutes: Math.max(0, Math.round((end - start) / 60_000)),
    });
  }
  return Object.freeze(out);
}

function toWorkoutSummaries(results: readonly NativeWorkoutValue[]): readonly WorkoutSummary[] {
  const out: WorkoutSummary[] = [];
  for (const r of results) {
    if (typeof r.start !== 'string' || typeof r.end !== 'string') continue;
    out.push({
      id: typeof r.id === 'string' && r.id.length > 0 ? r.id : `${r.start}-${r.end}`,
      activityName: typeof r.activityName === 'string' ? r.activityName : 'Workout',
      start: r.start,
      end: r.end,
      calories: Number.isFinite(r.calories) ? Number(r.calories) : 0,
      duration: Number.isFinite(r.duration) ? Number(r.duration) : 0,
    });
  }
  return Object.freeze(out);
}

function deriveAuthMap(
  result: NativeAuthStatusResult,
): Readonly<Record<HealthSampleId, AuthStatus>> {
  // react-native-health returns numeric arrays where:
  //   0 = not determined, 1 = sharing denied, 2 = sharing authorized.
  const reads = result.permissions?.read ?? [];
  const map: Record<HealthSampleId, AuthStatus> = {
    steps: statusFromCode(reads[0]),
    heartRate: statusFromCode(reads[1]),
    sleep: statusFromCode(reads[2]),
    workouts: statusFromCode(reads[3]),
    weight: statusFromCode(reads[4]),
  };
  return Object.freeze(map);
}

function statusFromCode(code: number | undefined): AuthStatus {
  if (code === 2) return 'authorized';
  if (code === 1) return 'denied';
  return 'undetermined';
}

export function useHealthKit(): UseHealthKitReturn {
  const aliveRef = useRef(true);
  const observerActiveRef = useRef(false);

  const [initialised, setInitialised] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [authStatusByType, setAuthStatusByType] = useState<
    Readonly<Record<HealthSampleId, AuthStatus>>
  >(() => makeInitialAuthMap());
  const [steps7d, setSteps7d] = useState<readonly DailyStep[]>(Object.freeze<DailyStep[]>([]));
  const [heartRate24h, setHeartRate24h] = useState<readonly HeartRateSample[]>(
    Object.freeze<HeartRateSample[]>([]),
  );
  const [latestHeartRate, setLatestHeartRate] = useState<HeartRateSample | null>(null);
  const [sleepLastNight, setSleepLastNight] = useState<readonly SleepSegment[]>(
    Object.freeze<SleepSegment[]>([]),
  );
  const [workouts, setWorkouts] = useState<readonly WorkoutSummary[]>(
    Object.freeze<WorkoutSummary[]>([]),
  );
  const [weight, setWeight] = useState<WeightSample | null>(null);
  const [observerActive, setObserverActive] = useState(false);
  const [observerUpdateCount, setObserverUpdateCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const safeSet = useCallback(<T>(setter: (v: T) => void, value: T) => {
    if (aliveRef.current) setter(value);
  }, []);

  const handleError = useCallback(
    (scope: string, err: unknown) => {
      if (err === null || err === undefined || err === '') return;
      const msg =
        typeof err === 'string' ? err : ((err as { message?: string })?.message ?? String(err));
      safeSet(setLastError, `${scope}: ${msg}`);
    },
    [safeSet],
  );

  const refreshAll = useCallback(async () => {
    const native = getNativeModule();
    const now = new Date();
    const startOfWeek = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();
    const start24h = new Date(now.getTime() - DAY_MS).toISOString();
    const startOfNight = new Date(now.getTime() - DAY_MS).toISOString();
    const nowIso = now.toISOString();

    const stepsP = new Promise<void>((resolve) => {
      native.getDailyStepCountSamples({ startDate: startOfWeek, endDate: nowIso }, (err, res) => {
        if (err !== null && err !== undefined && err !== '') handleError('steps', err);
        else safeSet(setSteps7d, bucketStepsByDay(res ?? [], isoDay(now)));
        resolve();
      });
    });

    const hrP = new Promise<void>((resolve) => {
      native.getHeartRateSamples(
        { startDate: start24h, endDate: nowIso, limit: 200 },
        (err, res) => {
          if (err !== null && err !== undefined && err !== '') {
            handleError('heartRate', err);
          } else {
            const samples = toHeartRateSamples(res ?? []);
            safeSet(setHeartRate24h, samples);
            safeSet(setLatestHeartRate, samples.length > 0 ? samples[samples.length - 1] : null);
          }
          resolve();
        },
      );
    });

    const sleepP = new Promise<void>((resolve) => {
      native.getSleepSamples(
        { startDate: startOfNight, endDate: nowIso, limit: 50 },
        (err, res) => {
          if (err !== null && err !== undefined && err !== '') handleError('sleep', err);
          else safeSet(setSleepLastNight, toSleepSegments(res ?? []));
          resolve();
        },
      );
    });

    const workoutP = new Promise<void>((resolve) => {
      native.getAnchoredWorkouts(
        { startDate: startOfWeek, endDate: nowIso, limit: 10 },
        (err, res) => {
          if (err !== null && err !== undefined && err !== '') handleError('workouts', err);
          else safeSet(setWorkouts, toWorkoutSummaries(res?.data ?? []));
          resolve();
        },
      );
    });

    const weightP = new Promise<void>((resolve) => {
      native.getLatestWeight({ unit: 'gram' }, (err, res) => {
        if (err !== null && err !== undefined && err !== '') {
          handleError('weight', err);
        } else if (
          res !== null &&
          res !== undefined &&
          Number.isFinite(res.value) &&
          typeof res.startDate === 'string'
        ) {
          safeSet(setWeight, {
            kg: Math.round((res.value / 1000) * 100) / 100,
            timestamp: res.startDate,
          });
        }
        resolve();
      });
    });

    await Promise.all([stepsP, hrP, sleepP, workoutP, weightP]);
  }, [handleError, safeSet]);

  const init = useCallback(async () => {
    const native = getNativeModule();
    await new Promise<void>((resolve) => {
      native.initHealthKit(
        { permissions: { read: READ_PERMISSIONS, write: WRITE_PERMISSIONS } },
        (err) => {
          if (err !== null && err !== undefined && err !== '') {
            handleError('init', err);
            safeSet(setAvailable, false);
          } else {
            safeSet(setAvailable, true);
            safeSet(setInitialised, true);
          }
          resolve();
        },
      );
    });

    if (!aliveRef.current) return;

    await new Promise<void>((resolve) => {
      native.getAuthStatus(
        { permissions: { read: READ_PERMISSIONS, write: WRITE_PERMISSIONS } },
        (err, res) => {
          if (err !== null && err !== undefined && err !== '') handleError('authStatus', err);
          else safeSet(setAuthStatusByType, deriveAuthMap(res));
          resolve();
        },
      );
    });

    if (aliveRef.current) await refreshAll();
  }, [handleError, refreshAll, safeSet]);

  const writeManualHeartRate = useCallback(
    async (bpm: number) => {
      if (!Number.isFinite(bpm) || bpm <= 0) {
        handleError('writeHeartRate', 'invalid bpm');
        return;
      }
      const native = getNativeModule();
      const save = native.saveHeartRateSample;
      if (typeof save !== 'function') {
        handleError('writeHeartRate', 'saveHeartRateSample not available');
        return;
      }
      const now = new Date().toISOString();
      await new Promise<void>((resolve) => {
        save({ value: bpm, startDate: now, endDate: now }, (err) => {
          if (err !== null && err !== undefined && err !== '') handleError('writeHeartRate', err);
          resolve();
        });
      });
      if (aliveRef.current) await refreshAll();
    },
    [handleError, refreshAll],
  );

  const writeWeight = useCallback(
    async (kg: number) => {
      if (!Number.isFinite(kg) || kg <= 0) {
        handleError('writeWeight', 'invalid kg');
        return;
      }
      const native = getNativeModule();
      await new Promise<void>((resolve) => {
        native.saveWeight({ value: kg * 1000, unit: 'gram' }, (err) => {
          if (err !== null && err !== undefined && err !== '') handleError('writeWeight', err);
          resolve();
        });
      });
      if (aliveRef.current) await refreshAll();
    },
    [handleError, refreshAll],
  );

  const toggleObserver = useCallback(() => {
    const native = getNativeModule();
    const next = !observerActiveRef.current;
    if (next) {
      try {
        native.setObserver({ type: 'StepCount' });
      } catch (err) {
        handleError('observer', err);
        return;
      }
    }
    observerActiveRef.current = next;
    safeSet(setObserverActive, next);
  }, [handleError, safeSet]);

  const reset = useCallback(() => {
    safeSet(setLastError, null);
    safeSet(setObserverUpdateCount, 0);
  }, [safeSet]);

  // Mount + unmount lifecycle. We listen to the global RN event for
  // observer notifications (the native side emits a DeviceEventEmitter
  // event named `healthKit:StepCount:new`), with a graceful fallback if
  // DeviceEventEmitter is unavailable in the test env. We also kick off
  // an automatic init() on mount so the screen doesn't need a separate
  // mount-effect.
  useEffect(() => {
    aliveRef.current = true;

    let subscription: { remove: () => void } | null = null;
    try {
      const { NativeAppEventEmitter } = require('react-native');
      if (
        NativeAppEventEmitter !== undefined &&
        typeof NativeAppEventEmitter.addListener === 'function'
      ) {
        subscription = NativeAppEventEmitter.addListener('healthKit:StepCount:new', () => {
          if (!aliveRef.current) return;
          if (!observerActiveRef.current) return;
          setObserverUpdateCount((n) => n + 1);
        });
      }
    } catch {
      // No event emitter (jest env without RN). Tests inject events
      // directly via the exposed __setHealthKitModuleForTests seam.
    }

    void init();

    return () => {
      aliveRef.current = false;
      if (subscription !== null) {
        try {
          subscription.remove();
        } catch {
          /* ignore */
        }
      }
      observerActiveRef.current = false;
    };
    // We intentionally only run this once on mount; init is stable.
  }, [init]);

  return {
    available,
    initialised,
    authStatusByType,
    steps7d,
    heartRate24h,
    latestHeartRate,
    sleepLastNight,
    workouts,
    weight,
    observerActive,
    observerUpdateCount,
    lastError,
    init,
    refreshAll,
    writeManualHeartRate,
    writeWeight,
    toggleObserver,
    reset,
  };
}
