# Phase 1 Data Model: Live Activities + Dynamic Island Showcase

This feature has no persistent database and no remote schema. The
"entities" below are the typed payloads, handles, and errors that flow
across the JS↔native boundary and that the Widget Extension consumes.

## E1. `LiveActivityState` (TypeScript, JS-side)

The minimal payload that flows from JS into the running activity. Lives
in `src/native/live-activity.types.ts`.

```ts
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
```

**Validation rules**:
- `counter >= 0` (enforced JS-side before each `update()` call).
- `name.length >= 1` (enforced JS-side before each `start()` call).
- `initialCounter >= 0` (enforced JS-side before `start()`).

**State transitions** (JS view of the world):

```text
       start({name, initialCounter})         end()
NONE  ────────────────────────────────▶  RUNNING ───────▶  NONE
                                         │
                                         │ update({counter: n+1})
                                         ▼
                                       RUNNING (counter advanced)
```

## E2. `LiveActivitySession` (TypeScript, JS-side, opaque)

The in-app representation of "an activity is currently running". Returned
by `start()`, consumed by `update()` and `end()`. Treated as opaque from
the screen's perspective — only the bridge interprets its contents.

```ts
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
```

**Lifecycle**: created by `start()`; mutated only by the bridge in
response to `update()`; destroyed by `end()` or by ActivityKit's own
time-limit termination (in which case the next `update()` rejects with a
typed "session ended" error and the screen reconciles to NONE).

## E3. `LiveActivityDemoAttributes` (Swift, native side)

Mirrors E1 + E2 across the language boundary. Lives in
`ios-widget/LiveActivityDemoAttributes.swift` and is imported by both the
Widget Extension target and the main app target (the Expo native module).

```swift
import ActivityKit

public struct LiveActivityDemoAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Monotonically non-decreasing while running. >= 0.
    public var counter: Int
  }

  /// Display name. Set once at start time, never mutated.
  public var name: String
}
```

**Validation rules** (Swift-side):
- `name` non-empty (asserted at `Activity.request` call site in
  `LiveActivityDemoModule.swift`).
- `counter >= 0` (asserted at `activity.update` call site).

**Derived view properties** (computed in `LiveActivityDemoWidget.swift`,
not stored in `ContentState`):
- `progress: Double = min(1.0, Double(state.counter) / 10.0)` — drives
  the progress bar on Lock Screen + DI expanded.

## E4. Error types (TypeScript)

```ts
/** Thrown by start/update/end on Android, web, and iOS < 16.1. */
export class LiveActivityNotSupportedError extends Error {
  readonly code = 'LIVE_ACTIVITY_NOT_SUPPORTED' as const;
}

/**
 * Thrown by start() when the user has disabled Live Activities for the
 * app in iOS Settings (or has never authorised). Drives FR-024's
 * user-facing "open Settings" message.
 */
export class LiveActivityAuthorisationError extends Error {
  readonly code = 'LIVE_ACTIVITY_AUTHORISATION' as const;
}

/**
 * Thrown by update()/end() when no activity is currently running
 * (race with system-imposed termination, or user error). Drives FR-025.
 */
export class LiveActivityNoActiveSessionError extends Error {
  readonly code = 'LIVE_ACTIVITY_NO_SESSION' as const;
}
```

**Why three error classes, not one**: each maps to a different user-
facing message (FR-023, FR-024, FR-025) and a different recovery action.
Using a `code` discriminant keeps narrowing exhaustive in TypeScript.

## E5. `ModuleManifest` (re-used from spec 006)

The Live Activity Demo module exports one `ModuleManifest` (contract at
`specs/006-ios-feature-showcase/contracts/module-manifest.md`). The
concrete values:

```ts
{
  id: 'live-activity-demo',
  title: 'Live Activity Demo',
  description: 'A counter that lives on your Lock Screen and Dynamic Island.',
  icon: { ios: 'bolt.badge.clock', fallback: '⚡' },
  platforms: ['ios'],
  minIOS: '16.1',
  render: () => <LiveActivityDemoScreen />,
}
```

**Why `platforms: ['ios']` and not `['ios', 'android', 'web']` with
runtime gating**: per spec 006's contract, `platforms` is the *declared*
support surface, and the registry-derived "iOS only" badge on
Android/web is what FR-003 requires. `minIOS: '16.1'` then layers the
"Requires iOS 16.1+" badge on iOS devices below that version (FR-004).

## Relationships

```text
ModuleManifest (per-module)
    │ (registered in)
    ▼
src/modules/registry.ts MODULES[]
    │ (rendered by)
    ▼
src/app/modules/index.tsx (cards) + src/app/modules/[id].tsx (detail)
    │ (detail invokes)
    ▼
LiveActivityDemoScreen (src/modules/live-activity-demo/screen.tsx)
    │ (calls)
    ▼
LiveActivityBridge (src/native/live-activity{.ts,.android.ts,.web.ts})
    │ (iOS only, via requireNativeModule)
    ▼
LiveActivityDemoModule.swift (in main app target)
    │ (calls Activity.request/update/end with)
    ▼
LiveActivityDemoAttributes (in Widget Extension target, shared file ref)
    │ (rendered by)
    ▼
ActivityConfiguration in LiveActivityDemoWidget.swift
    │ (drives)
    ▼
Lock Screen view  +  Dynamic Island {compact, expanded, minimal}
```
