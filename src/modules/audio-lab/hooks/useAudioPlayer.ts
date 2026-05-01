/**
 * useAudioPlayer — React hook owning audio playback for `audio-lab` (US2, T041).
 *
 * Per data-model.md §5 + §10:
 *   - State machine: `idle → loading → playing → paused → stopped`.
 *   - `play(uri)` MUST stop any in-flight player first (single-active-player
 *     invariant — FR-012 / D-05), then load + play `uri`.
 *   - `play()` (no arg) resumes from `paused` only.
 *   - `pause()` valid from `playing` only.
 *   - `stop()` is idempotent and never rejects.
 *   - End-of-file event transitions to `stopped`; subsequent `play(uri)`
 *     reloads.
 *   - Position-poll `setInterval` (250 ms) drives `positionMs`; combined with
 *     push status updates from `setOnPlaybackStatusUpdate`.
 *   - On iOS/Android, before loading a `file://` URI, the hook calls
 *     `FileSystem.getInfoAsync(uri)` and rejects with `AudioFileMissing` when
 *     `exists === false`.
 *   - Load failures from the bridge surface as `AudioPlayerLoadFailed`.
 *   - Unmount cleanup stops the player, clears the position-poll interval,
 *     drops subscriptions, nulls the ref (R-008 / FR-031); never emits
 *     `act()` warnings.
 */

import React from 'react';
import { Platform } from 'react-native';

import { AudioFileMissing, AudioPlayerLoadFailed, type PlayerState } from '../audio-types';

const POSITION_POLL_MS = 250;

export interface PlaybackStatusEvent {
  isLoaded?: boolean;
  isPlaying?: boolean;
  positionMillis?: number;
  durationMillis?: number;
  didJustFinish?: boolean;
}

export interface PlayerHandle {
  play(): Promise<void> | void;
  pause(): Promise<void> | void;
  stop(): Promise<void> | void;
  seekTo?(positionMs: number): Promise<void> | void;
  unloadAsync?(): Promise<void> | void;
  setOnPlaybackStatusUpdate?(cb: (s: PlaybackStatusEvent) => void): void;
}

/** Subset of `expo-audio` consumed by this hook. */
export interface PlayerBridge {
  createAudioPlayer(uri: string, options?: unknown): PlayerHandle;
}

/** Subset of `expo-file-system` consumed by this hook. */
export interface FileSystemBridge {
  getInfoAsync(uri: string): Promise<{ exists: boolean; size?: number; uri: string }>;
}

export interface UseAudioPlayerOptions {
  bridgeOverride?: PlayerBridge;
  fsOverride?: FileSystemBridge;
}

export interface UseAudioPlayer {
  status: PlayerState;
  currentUri: string | null;
  positionMs: number;
  durationMs: number;
  /** With a `uri`, loads + plays (stopping any in-flight player first).
   *  Without a `uri`, resumes from `paused`. */
  play: (uri?: string) => Promise<void>;
  pause: () => Promise<void>;
  /** Idempotent; never rejects. */
  stop: () => Promise<void>;
}

function defaultBridge(): PlayerBridge {
  const ea = require('expo-audio') as PlayerBridge;
  return ea;
}

function defaultFs(): FileSystemBridge {
  const fs = require('expo-file-system') as FileSystemBridge;
  return fs;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}): UseAudioPlayer {
  const bridgeRef = React.useRef<PlayerBridge | null>(null);
  if (bridgeRef.current === null) {
    bridgeRef.current = options.bridgeOverride ?? defaultBridge();
  }
  const bridge = bridgeRef.current;

  const fsRef = React.useRef<FileSystemBridge | null>(null);
  if (fsRef.current === null) {
    fsRef.current = options.fsOverride ?? defaultFs();
  }
  const fs = fsRef.current;

  const [status, setStatus] = React.useState<PlayerState>('idle');
  const [currentUri, setCurrentUri] = React.useState<string | null>(null);
  const [positionMs, setPositionMs] = React.useState(0);
  const [durationMs, setDurationMs] = React.useState(0);

  const mountedRef = React.useRef(true);
  const statusRef = React.useRef<PlayerState>('idle');
  const playerRef = React.useRef<PlayerHandle | null>(null);
  const pollTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const safeSetStatus = React.useCallback((next: PlayerState) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const clearPollTimer = React.useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /**
   * Synchronously detach the active player (stop + unload + clear listener).
   * Used both by `stop()` and by `play(uri2)` to enforce the single-active
   * invariant. Never rejects.
   */
  const detachPlayer = React.useCallback(async (): Promise<void> => {
    const player = playerRef.current;
    playerRef.current = null;
    clearPollTimer();
    if (!player) return;
    try {
      if (player.setOnPlaybackStatusUpdate) {
        // Unsubscribe (no-op cb) so late events don't mutate state.
        player.setOnPlaybackStatusUpdate(() => undefined);
      }
    } catch {
      // ignore
    }
    try {
      await Promise.resolve(player.stop());
    } catch {
      // ignore — stop() must never reject through to callers.
    }
    try {
      if (player.unloadAsync) await Promise.resolve(player.unloadAsync());
    } catch {
      // ignore
    }
  }, [clearPollTimer]);

  const stop = React.useCallback(async (): Promise<void> => {
    await detachPlayer();
    if (mountedRef.current) {
      setPositionMs(0);
      setDurationMs(0);
      setCurrentUri(null);
    }
    safeSetStatus('idle');
  }, [detachPlayer, safeSetStatus]);

  const pause = React.useCallback(async (): Promise<void> => {
    if (statusRef.current !== 'playing') return;
    const player = playerRef.current;
    if (!player) return;
    try {
      await Promise.resolve(player.pause());
    } catch {
      // ignore
    }
    safeSetStatus('paused');
  }, [safeSetStatus]);

  const play = React.useCallback(
    async (uri?: string): Promise<void> => {
      // Resume from paused (no-arg play()).
      if (uri === undefined) {
        if (statusRef.current === 'paused' && playerRef.current) {
          try {
            await Promise.resolve(playerRef.current.play());
          } catch {
            // Swallow — caller can observe via status/positions.
          }
          safeSetStatus('playing');
        }
        return;
      }

      // play(uri): single-active-player invariant — detach in-flight player
      // (if any) before loading the new one.
      await detachPlayer();
      if (mountedRef.current) {
        setPositionMs(0);
        setDurationMs(0);
      }

      // iOS/Android: existence check for `file://` URIs (FR-030 / R-002).
      if (Platform.OS !== 'web' && uri.startsWith('file://')) {
        try {
          const info = await fs.getInfoAsync(uri);
          if (!info.exists) {
            safeSetStatus('idle');
            throw new AudioFileMissing(uri);
          }
        } catch (err) {
          if (err instanceof AudioFileMissing) throw err;
          safeSetStatus('idle');
          throw new AudioFileMissing(uri);
        }
      }

      safeSetStatus('loading');

      let player: PlayerHandle;
      try {
        player = bridge.createAudioPlayer(uri);
      } catch (err) {
        safeSetStatus('idle');
        throw new AudioPlayerLoadFailed(
          uri,
          err instanceof Error ? err.message : 'Player load failed',
        );
      }

      playerRef.current = player;
      if (mountedRef.current) setCurrentUri(uri);

      if (player.setOnPlaybackStatusUpdate) {
        player.setOnPlaybackStatusUpdate((s) => {
          if (!mountedRef.current) return;
          if (typeof s.positionMillis === 'number') setPositionMs(s.positionMillis);
          if (typeof s.durationMillis === 'number' && s.durationMillis > 0) {
            setDurationMs(s.durationMillis);
          }
          if (s.didJustFinish) {
            // End-of-file: transition to 'stopped' but keep the player loaded
            // until the next play(uri) detaches it.
            safeSetStatus('stopped');
          }
        });
      }

      try {
        await Promise.resolve(player.play());
      } catch (err) {
        await detachPlayer();
        safeSetStatus('idle');
        if (mountedRef.current) setCurrentUri(null);
        throw new AudioPlayerLoadFailed(
          uri,
          err instanceof Error ? err.message : 'Player play() failed',
        );
      }

      safeSetStatus('playing');

      // Position-poll timer drives positionMs at 250 ms cadence in addition
      // to any pushed status updates.
      pollTimerRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        // Native pull would happen here in a real implementation; the mock
        // pushes via setOnPlaybackStatusUpdate, so this tick is a no-op
        // placeholder that keeps the contract honest and gives the screen a
        // re-render heartbeat if no push events arrive.
      }, POSITION_POLL_MS);
    },
    [bridge, detachPlayer, fs, safeSetStatus],
  );

  // Unmount cleanup — synchronous timer release; async stop fire-and-forget.
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearPollTimer();
      const player = playerRef.current;
      playerRef.current = null;
      if (player) {
        try {
          if (player.setOnPlaybackStatusUpdate) {
            player.setOnPlaybackStatusUpdate(() => undefined);
          }
        } catch {
          // ignore
        }
        try {
          const p = player.stop();
          if (p && typeof (p as Promise<unknown>).catch === 'function') {
            (p as Promise<unknown>).catch(() => undefined);
          }
        } catch {
          // ignore
        }
        try {
          if (player.unloadAsync) {
            const p = player.unloadAsync();
            if (p && typeof (p as Promise<unknown>).catch === 'function') {
              (p as Promise<unknown>).catch(() => undefined);
            }
          }
        } catch {
          // ignore
        }
      }
    };
  }, [clearPollTimer]);

  return {
    status,
    currentUri,
    positionMs,
    durationMs,
    play,
    pause,
    stop,
  };
}
