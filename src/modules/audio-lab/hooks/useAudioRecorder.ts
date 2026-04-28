/**
 * useAudioRecorder — React hook owning the audio-recording lifecycle for
 * `audio-lab` (feature 020, US1).
 *
 * Responsibilities:
 *   - Lazy microphone-permission request on `start()` (D-14 / FR-026).
 *   - State machine: `idle → requesting-permission → recording → stopping → idle`.
 *   - 250 ms `setInterval` driving `elapsedMs` (FR-004 / SC-002).
 *   - Push subscription via `setOnRecordingStatusUpdate` driving `meterLevel`
 *     (FR-005 / R-004); the mock emits at ~10 Hz.
 *   - `setQuality` is a no-op while `status === 'recording'` (FR-008).
 *   - On `stop()`: finalize file, compute `durationMs` / `sizeBytes`, persist
 *     via `recordings-store.saveRecording`, resolve with the new `Recording`.
 *     Idempotent — a second `stop()` resolves with the cached `Recording`.
 *   - On unmount: stop the recorder, clear timers, drop subscriptions, never
 *     emit `act()` warnings (R-008 / FR-031).
 *
 * Components import this hook only — they never touch `expo-audio` directly
 * (data-model §10).
 */

import React from 'react';
import { Platform } from 'react-native';

import {
  AudioPermissionDenied,
  AudioRecorderUnavailable,
  type PermissionStatus,
  type QualityName,
  type Recording,
  type RecorderState,
} from '../audio-types';
import { getPreset, WEB_PRESETS } from '../quality-presets';
import { saveRecording as defaultSaveRecording } from '../recordings-store';

/** Subset of the `expo-audio` surface this hook depends on. */
export interface RecorderBridge {
  requestRecordingPermissionsAsync(): Promise<{ status: PermissionStatus; granted: boolean }>;
  getRecordingPermissionsAsync(): Promise<{ status: PermissionStatus; granted: boolean }>;
  createAudioRecorder(options: unknown): RecorderHandle;
}

export interface RecorderStatusEvent {
  isRecording: boolean;
  durationMillis: number;
  metering?: number;
}

export interface RecorderHandle {
  startAsync(): Promise<void>;
  stopAndUnloadAsync(): Promise<{ uri: string; size?: number }>;
  setOnRecordingStatusUpdate?(cb: (s: RecorderStatusEvent) => void): void;
}

export interface UseAudioRecorderOptions {
  bridgeOverride?: RecorderBridge;
  saveRecordingOverride?: (r: Recording) => Promise<Recording[]>;
  /** Override clock for deterministic tests. */
  nowOverride?: () => number;
  /** Override id generator for deterministic tests. */
  idOverride?: () => string;
}

export interface UseAudioRecorder {
  status: RecorderState;
  elapsedMs: number;
  meterLevel: number;
  quality: QualityName;
  hasPermission: PermissionStatus;
  setQuality: (q: QualityName) => void;
  start: () => Promise<void>;
  stop: () => Promise<Recording>;
  requestPermission: () => Promise<PermissionStatus>;
}

const ELAPSED_TICK_MS = 250;

function defaultId(): string {
  const g = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
  if (g?.randomUUID) return g.randomUUID();
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatRecordingName(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth() + 1);
  const da = pad2(d.getUTCDate());
  const h = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const s = pad2(d.getUTCSeconds());
  return `${y}-${mo}-${da}-${h}-${mi}-${s}.m4a`;
}

/**
 * Lazily resolves the default `expo-audio` bridge. Lazy so test files that
 * `jest.mock('expo-audio', ...)` see the mocked module first.
 */
function defaultBridge(): RecorderBridge {
  // require() is used so jest.mock('expo-audio') intercepts before resolution.
  const ea = require('expo-audio') as RecorderBridge;
  return ea;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorder {
  const bridgeRef = React.useRef<RecorderBridge | null>(null);
  if (bridgeRef.current === null) {
    bridgeRef.current = options.bridgeOverride ?? defaultBridge();
  }
  const bridge = bridgeRef.current;
  const saveRecording = options.saveRecordingOverride ?? defaultSaveRecording;
  const nowRef = React.useRef<() => number>(options.nowOverride ?? (() => Date.now()));
  const newIdRef = React.useRef<() => string>(options.idOverride ?? defaultId);
  const now = React.useCallback(() => nowRef.current(), []);
  const newId = React.useCallback(() => newIdRef.current(), []);

  const [status, setStatus] = React.useState<RecorderState>('idle');
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [meterLevel, setMeterLevel] = React.useState(0);
  const [quality, setQualityState] = React.useState<QualityName>('Medium');
  const [hasPermission, setHasPermission] = React.useState<PermissionStatus>('undetermined');

  const mountedRef = React.useRef(true);
  const statusRef = React.useRef<RecorderState>('idle');
  const recorderRef = React.useRef<RecorderHandle | null>(null);
  const elapsedTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = React.useRef<number>(0);
  const elapsedAtStopRef = React.useRef<number>(0);
  const qualityRef = React.useRef<QualityName>('Medium');
  const lastRecordingRef = React.useRef<Recording | null>(null);
  const stopInFlightRef = React.useRef<Promise<Recording> | null>(null);

  const safeSetStatus = React.useCallback((next: RecorderState) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const clearElapsedTimer = React.useCallback(() => {
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const setQuality = React.useCallback((q: QualityName) => {
    if (statusRef.current === 'recording' || statusRef.current === 'stopping') {
      // FR-008: no-op while recording.
      return;
    }
    qualityRef.current = q;
    if (mountedRef.current) setQualityState(q);
  }, []);

  const requestPermission = React.useCallback(async (): Promise<PermissionStatus> => {
    const result = await bridge.requestRecordingPermissionsAsync();
    if (mountedRef.current) setHasPermission(result.status);
    return result.status;
  }, [bridge]);

  const start = React.useCallback(async (): Promise<void> => {
    if (statusRef.current !== 'idle') return;

    safeSetStatus('requesting-permission');
    let permResult: { status: PermissionStatus; granted: boolean };
    try {
      permResult = await bridge.requestRecordingPermissionsAsync();
    } catch {
      safeSetStatus('idle');
      throw new AudioRecorderUnavailable('Permission request failed');
    }
    if (mountedRef.current) setHasPermission(permResult.status);

    if (!permResult.granted) {
      safeSetStatus('idle');
      throw new AudioPermissionDenied('Microphone permission denied');
    }

    let recorder: RecorderHandle;
    try {
      const preset = getPreset(qualityRef.current);
      // R-005: Web ignores sampleRate/channels (driven by source MediaStream);
      // only `audioBitsPerSecond` is honored. Native (iOS/Android) accepts the
      // expo-audio recorder option shape: `bitRate` (camelCase, capital R).
      const config =
        Platform.OS === 'web'
          ? { ...WEB_PRESETS[qualityRef.current] }
          : {
              sampleRate: preset.sampleRate,
              numberOfChannels: preset.channels,
              bitRate: preset.bitrate,
              format: preset.format,
              isMeteringEnabled: true,
            };
      recorder = bridge.createAudioRecorder(config);
    } catch {
      safeSetStatus('idle');
      throw new AudioRecorderUnavailable('expo-audio failed to construct recorder');
    }

    recorderRef.current = recorder;
    lastRecordingRef.current = null;
    stopInFlightRef.current = null;

    if (recorder.setOnRecordingStatusUpdate) {
      recorder.setOnRecordingStatusUpdate((s) => {
        if (!mountedRef.current) return;
        if (typeof s.metering === 'number' && Number.isFinite(s.metering)) {
          // Clamp into [0, 1] — some backends report dBFS in [-160, 0]; the
          // mock emits already-normalized values.
          const lvl = s.metering;
          const clamped = lvl < 0 ? Math.max(0, Math.min(1, (lvl + 160) / 160)) : Math.max(0, Math.min(1, lvl));
          setMeterLevel(clamped);
        }
      });
    }

    try {
      await recorder.startAsync();
    } catch {
      recorderRef.current = null;
      safeSetStatus('idle');
      throw new AudioRecorderUnavailable('expo-audio failed to start recorder');
    }

    startedAtRef.current = now();
    if (mountedRef.current) {
      setElapsedMs(0);
      setMeterLevel(0);
    }

    elapsedTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setElapsedMs((prev) => prev + ELAPSED_TICK_MS);
    }, ELAPSED_TICK_MS);

    safeSetStatus('recording');
  }, [bridge, now, safeSetStatus]);

  const stop = React.useCallback(async (): Promise<Recording> => {
    if (statusRef.current === 'stopping' && stopInFlightRef.current) {
      return stopInFlightRef.current;
    }
    if (statusRef.current === 'idle') {
      if (lastRecordingRef.current) return lastRecordingRef.current;
      throw new Error('No recording in progress');
    }
    if (statusRef.current === 'requesting-permission') {
      // Should not happen in normal flow; reset.
      safeSetStatus('idle');
      throw new Error('Cannot stop while requesting permission');
    }

    const recorder = recorderRef.current;
    if (!recorder) {
      safeSetStatus('idle');
      throw new Error('No active recorder');
    }

    safeSetStatus('stopping');
    clearElapsedTimer();
    const stoppedAt = now();
    const durationMs = Math.max(0, stoppedAt - startedAtRef.current);
    elapsedAtStopRef.current = durationMs;

    const work = (async (): Promise<Recording> => {
      let result: { uri: string; size?: number };
      try {
        result = await recorder.stopAndUnloadAsync();
      } finally {
        recorderRef.current = null;
      }

      const recording: Recording = {
        id: newId(),
        name: formatRecordingName(new Date(stoppedAt)),
        uri: result.uri,
        durationMs,
        sizeBytes: typeof result.size === 'number' ? result.size : 0,
        createdAt: new Date(stoppedAt).toISOString(),
        quality: qualityRef.current,
      };

      try {
        await saveRecording(recording);
      } catch (err) {
        // Persistence failure must not crash; log and surface the unsaved
        // Recording so the screen can still render it.
        console.warn('[audio-lab] saveRecording failed', err);
      }

      lastRecordingRef.current = recording;
      if (mountedRef.current) {
        setElapsedMs(durationMs);
        setMeterLevel(0);
      }
      safeSetStatus('idle');
      return recording;
    })();

    stopInFlightRef.current = work;
    try {
      return await work;
    } finally {
      stopInFlightRef.current = null;
    }
  }, [clearElapsedTimer, newId, now, safeSetStatus, saveRecording]);

  // Unmount cleanup — synchronous timer / handle release; async stop is fire-
  // and-forget to avoid `act()` warnings.
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearElapsedTimer();
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder) {
        try {
          const p = recorder.stopAndUnloadAsync();
          if (p && typeof (p as Promise<unknown>).catch === 'function') {
            (p as Promise<unknown>).catch(() => undefined);
          }
        } catch {
          // ignore
        }
      }
    };
  }, [clearElapsedTimer]);

  return {
    status,
    elapsedMs,
    meterLevel,
    quality,
    hasPermission,
    setQuality,
    start,
    stop,
    requestPermission,
  };
}
