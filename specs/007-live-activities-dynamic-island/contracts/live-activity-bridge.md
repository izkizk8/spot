# Contract: `LiveActivityBridge`

The TypeScript surface every JS consumer (and every platform stub) MUST
honour. This is the *only* coupling between `screen.tsx` and the native
side.

## Source location

`src/native/live-activity.types.ts` (interface + errors), implemented by:
- `src/native/live-activity.ts` — iOS
- `src/native/live-activity.android.ts` — stub
- `src/native/live-activity.web.ts` — stub

## TypeScript declaration

```ts
import type {
  LiveActivitySession,
  LiveActivityStartArgs,
  LiveActivityState,
} from './live-activity.types';

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
```

## Invariants (test-enforced)

- The default export of each platform file MUST satisfy
  `LiveActivityBridge` — TypeScript catches the structural mismatch.
- No exported function ever returns `undefined` from a `Promise`.
- No exported function uses `any` (constitution, FR-017).
- Importing any of the three platform files MUST NOT throw (FR-018);
  in particular the `.android.ts` and `.web.ts` files MUST NOT call
  `requireNativeModule` at module load time.
- Calling any of `start`/`update`/`end` on the `.android.ts` or `.web.ts`
  stub MUST reject with `LiveActivityNotSupportedError`.

## Consumer responsibilities

- `screen.tsx` MUST call `current()` once on mount (FR-009 reconcile),
  then drive its own state from the result.
- `screen.tsx` MUST narrow on the `code` discriminant of caught errors
  to render the right message (FR-023, FR-024, FR-025) — never display a
  raw `Error.message` to the user.
- `screen.tsx` MUST disable the Update / End buttons whenever its local
  view of the session is `null`, and disable Start whenever it is
  non-null (FR-008).

## Stability

Stable for the lifetime of this feature. Adding a new bridge method
(e.g., a future `pause()`) is a non-breaking minor extension. Changing
or removing any of the five methods above requires a new spec.
