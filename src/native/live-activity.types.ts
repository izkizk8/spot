/**
 * Types for the Live Activity bridge.
 *
 * This file is the single source of truth for the JS↔native boundary
 * contract. All platform implementations MUST satisfy `LiveActivityBridge`.
 *
 * @see specs/007-live-activities-dynamic-island/contracts/live-activity-bridge.md
 */

/**
 * The mutable state of a Live Activity Demo session.
 *
 * Kept intentionally small (FR-011 budget: 500 ms end-to-end propagation).
 * `progress` is NOT included here — it is derived view-side in Swift as
 *   `min(1.0, Double(counter) / 10.0)`.
 */
export interface LiveActivityState {
  /** Monotonically non-decreasing while an activity is running. >= 0. */
  readonly counter: number;
}

/**
 * The static, per-session attributes set once at start time.
 * Maps 1:1 onto Swift's `LiveActivityDemoAttributes` (non-ContentState).
 */
export interface LiveActivityStartArgs {
  /** Display name shown in the Lock Screen + DI expanded views. Non-empty. */
  readonly name: string;
  /** Initial counter. Defaults to 0. >= 0. */
  readonly initialCounter: number;
}

/**
 * Opaque session handle. Exists for the lifetime of one start→end cycle.
 * Re-hydrated from the system on screen mount per FR-009.
 */
export interface LiveActivitySession {
  /** Stable per-session id assigned by ActivityKit. */
  readonly id: string;
  /** The static attributes the session was started with. */
  readonly attributes: LiveActivityStartArgs;
  /** Last known state. Updated locally after every successful update(). */
  readonly state: LiveActivityState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Classes
// ─────────────────────────────────────────────────────────────────────────────

/** Thrown by start/update/end on Android, web, and iOS < 16.1. */
export class LiveActivityNotSupportedError extends Error {
  readonly code = 'LIVE_ACTIVITY_NOT_SUPPORTED' as const;
  constructor(message = 'Live Activities are not supported on this platform.') {
    super(message);
    this.name = 'LiveActivityNotSupportedError';
  }
}

/**
 * Thrown by start() when the user has disabled Live Activities for the
 * app in iOS Settings (or has never authorised). Drives FR-024's
 * user-facing "open Settings" message.
 */
export class LiveActivityAuthorisationError extends Error {
  readonly code = 'LIVE_ACTIVITY_AUTHORISATION' as const;
  constructor(message = 'Live Activities are disabled for this app. Enable them in iOS Settings.') {
    super(message);
    this.name = 'LiveActivityAuthorisationError';
  }
}

/**
 * Thrown by update()/end() when no activity is currently running
 * (race with system-imposed termination, or user error). Drives FR-025.
 */
export class LiveActivityNoActiveSessionError extends Error {
  readonly code = 'LIVE_ACTIVITY_NO_SESSION' as const;
  constructor(message = 'No Live Activity is currently running.') {
    super(message);
    this.name = 'LiveActivityNoActiveSessionError';
  }
}

/**
 * Thrown by start() when an activity is already running for this
 * attributes type. Prevents duplicate activities.
 */
export class LiveActivityAlreadyRunningError extends Error {
  readonly code = 'LIVE_ACTIVITY_ALREADY_RUNNING' as const;
  constructor(message = 'A Live Activity is already running.') {
    super(message);
    this.name = 'LiveActivityAlreadyRunningError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bridge Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The TypeScript surface every JS consumer (and every platform stub) MUST
 * honour. This is the *only* coupling between `screen.tsx` and the native
 * side.
 */
export interface LiveActivityBridge {
  /**
   * Synchronous availability probe.
   * - iOS 16.1+ with the native module resolved → true.
   * - Anything else (iOS < 16.1, Android, web, native module missing) → false.
   *
   * MUST NOT throw. MUST be safe to call at any time, including before any
   * activity has been started.
   */
  isAvailable(): boolean;

  /**
   * Start a Live Activity. Resolves with the opaque session handle.
   *
   * Errors:
   * - `LiveActivityNotSupportedError` — non-iOS, or iOS < 16.1, or native
   *   module missing.
   * - `LiveActivityAuthorisationError` — user has disabled Live Activities
   *   for the app in iOS Settings.
   * - `LiveActivityAlreadyRunningError` — an activity is already running.
   * - Any other error from ActivityKit is re-thrown as-is, with a
   *   non-empty `message`.
   *
   * MUST NOT create a second concurrent activity if one is already
   * running for this attributes type — instead reject with a typed error
   * that the screen surfaces per FR-010 / spec edge case 2.
   */
  start(args: LiveActivityStartArgs): Promise<LiveActivitySession>;

  /**
   * Update the running activity's state.
   *
   * Errors:
   * - `LiveActivityNotSupportedError` — non-iOS / unsupported.
   * - `LiveActivityNoActiveSessionError` — no activity is currently
   *   running (race with system termination, or user error per FR-025).
   */
  update(state: LiveActivityState): Promise<LiveActivitySession>;

  /**
   * End the currently-running activity.
   *
   * Errors:
   * - `LiveActivityNotSupportedError` — non-iOS / unsupported.
   * - `LiveActivityNoActiveSessionError` — no activity is currently
   *   running.
   */
  end(): Promise<void>;

  /**
   * Reconcile to the actual system state (FR-009). Returns the current
   * session handle if ActivityKit reports an in-flight activity for this
   * attributes type, or `null` if none is running. MUST NOT throw on any
   * platform; on non-iOS / unsupported it returns `null`.
   */
  current(): Promise<LiveActivitySession | null>;
}
