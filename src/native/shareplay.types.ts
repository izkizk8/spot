/**
 * SharePlay (GroupActivities) bridge — shared type surface (feature 047).
 *
 * Types referenced by all four `src/native/shareplay*.ts` siblings
 * and by the `useGroupActivity` hook. Pure module: no React, no
 * native imports.
 */

export const NATIVE_MODULE_NAME = 'SharePlayBridge' as const;

/** Demo activity types vended by the showcase module. */
export type ActivityType = 'counter' | 'drawing' | 'quiz';

/** Coarse session lifecycle states surfaced through the bridge. */
export type SessionStatus = 'none' | 'preparing' | 'active' | 'ended';

export interface ActivityConfig {
  readonly type: ActivityType;
  readonly title: string;
}

export interface Participant {
  readonly id: string;
  readonly displayName: string | null;
}

export interface SessionState {
  readonly status: SessionStatus;
  readonly activity: ActivityConfig | null;
  readonly participants: readonly Participant[];
  readonly counter: number;
}

export type SessionStateListener = (state: SessionState) => void;

export interface SharePlayBridge {
  isAvailable(): boolean;
  getState(): SessionState;
  startActivity(config: ActivityConfig): Promise<void>;
  endActivity(): Promise<void>;
  sendCounter(value: number): Promise<void>;
  subscribe(listener: SessionStateListener): () => void;
}

/**
 * Typed error thrown by the Android / Web variants and by the iOS
 * variant when the native module is missing.
 */
export class SharePlayNotSupported extends Error {
  public readonly code = 'SHAREPLAY_NOT_SUPPORTED' as const;

  constructor(message = 'SharePlay is not available on this platform') {
    super(message);
    this.name = 'SharePlayNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SharePlayNotSupported);
    }
  }
}

export const INITIAL_SESSION_STATE: SessionState = Object.freeze({
  status: 'none' as SessionStatus,
  activity: null,
  participants: Object.freeze([]) as readonly Participant[],
  counter: 0,
});
