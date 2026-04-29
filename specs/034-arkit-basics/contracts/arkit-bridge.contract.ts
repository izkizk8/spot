/**
 * Contract: JS bridge to the iOS ARKit surface.
 *
 * @feature 034-arkit-basics
 * @see specs/034-arkit-basics/spec.md FR-007 .. FR-012, FR-022, FR-024
 * @see specs/034-arkit-basics/data-model.md Entities 1–6
 * @see specs/034-arkit-basics/research.md §1 (R-A serialisation),
 *      §3 (R-C lifecycle), §4 (R-D classification)
 *
 * Implementation files:
 *   - src/native/arkit.ts          (iOS path)
 *   - src/native/arkit.android.ts  (throws ARKitNotSupported on every AsyncFunction)
 *   - src/native/arkit.web.ts      (throws ARKitNotSupported on every AsyncFunction)
 *   - src/native/arkit.types.ts    (re-exports the types here)
 *
 * INVARIANTS (asserted by `test/unit/native/arkit.test.ts`):
 *   B1. Imperative module name is the literal string 'ARKitBridge'.
 *       ViewDefinition name is the literal string 'ARKitView'.
 *       Distinct from prior modules:
 *         - 013 'AppIntents'
 *         - 014/027/028 'WidgetCenter'
 *         - 029 'FocusFilters'
 *         - 030 'BackgroundTasks'
 *         - 031 'Spotlight'
 *         - 032 'QuickLook'
 *         - 033 'ShareSheet'
 *   B2. On iOS, every AsyncFunction delegates to the native module
 *       and resolves with the typed shape declared below.
 *   B3. All AsyncFunctions are serialised through a single closure-
 *       scoped promise chain inherited verbatim from 030 / 031 / 032 /
 *       033 (`enqueue` helper). Two back-to-back calls produce native
 *       invocations in submission order even if the first rejects
 *       (research §1 / R-A). Serialisation applies on all three
 *       platforms (Android / Web reject in submission order).
 *   B4. `isAvailable()` is NOT serialised; it is a pure synchronous
 *       read. On iOS it returns the native module's
 *       `ARWorldTrackingConfiguration.isSupported` value. On Android
 *       and Web it always returns `false`.
 *   B5. On Android, every AsyncFunction throws `ARKitNotSupported`.
 *   B6. On Web, every AsyncFunction throws `ARKitNotSupported`.
 *   B7. On iOS, when no `ARKitView` is currently mounted the bridge
 *       rejects with `Error('no-active-view')` (R-C). The hook
 *       suppresses this transient during the mount race per R-D.
 *   B8. `placeAnchorAt(x, y)` resolves with `void`; the resulting
 *       anchor is delivered via the `onAnchorAdded` event of the
 *       ViewDefinition. The bridge MUST NOT also return the
 *       AnchorRecord (single source of truth: the event stream).
 *   B9. `getSessionInfo()` is safe to call at any cadence; it never
 *       allocates Swift-side state.
 */

import type {
  PlaneDetectionMode,
  SessionState,
  TrackingState,
  ARKitConfiguration,
  AnchorRecord,
  SessionInfo,
} from './data-model-types';

export const NATIVE_MODULE_NAME = 'ARKitBridge' as const;
export const NATIVE_VIEW_NAME = 'ARKitView' as const;

/**
 * Typed error class thrown ONLY when an imperative AsyncFunction is
 * invoked on a non-iOS platform (B5 / B6) or on an iOS device whose
 * `ARWorldTrackingConfiguration.isSupported` is false.
 *
 * Exported from `src/native/arkit.types.ts` so that all three
 * sibling implementations (ios / android / web) share the same class
 * identity (a consumer may `instanceof`-check across platforms).
 */
export declare class ARKitNotSupported extends Error {
  readonly name: 'ARKitNotSupported';
  readonly code: 'ARKitNotSupported';
  constructor(message?: string);
}

export interface ARKitBridge {
  /**
   * Returns `true` only on iOS at runtime when the native module
   * reports `ARWorldTrackingConfiguration.isSupported === true`.
   * Returns `false` on Android, Web, and unsupported iOS devices.
   * Pure synchronous read; never throws.
   */
  readonly isAvailable: () => boolean;

  /**
   * Places an anchor at the given view-local coordinates and parents
   * a textured cube entity at the raycast hit. Resolves with `void`;
   * the resulting anchor is delivered via the ViewDefinition's
   * `onAnchorAdded` event (B8). When the raycast misses, the bridge
   * still resolves successfully (no error); no anchor is added.
   *
   * @throws ARKitNotSupported on Android / Web / unsupported iOS.
   * @throws Error('no-active-view') when called before any
   *         `ARKitView` is mounted (transient; R-C / R-D).
   */
  readonly placeAnchorAt: (x: number, y: number) => Promise<void>;

  /**
   * Removes all anchors added by this session and emits
   * `onAnchorRemoved` for each. Resolves with `void` on success.
   *
   * @throws ARKitNotSupported on Android / Web / unsupported iOS.
   */
  readonly clearAnchors: () => Promise<void>;

  /**
   * Pauses the active `ARSession` and freezes the duration counter.
   * Idempotent (calling on a paused session is a no-op).
   *
   * @throws ARKitNotSupported on Android / Web / unsupported iOS.
   */
  readonly pauseSession: () => Promise<void>;

  /**
   * Resumes the active `ARSession` with the current configuration.
   * Continues the duration counter from the value at pause time.
   * Idempotent.
   *
   * @throws ARKitNotSupported on Android / Web / unsupported iOS.
   */
  readonly resumeSession: () => Promise<void>;

  /**
   * Returns a snapshot of the session's current introspectable
   * state. Default polling cadence (per FR-015) is **500 ms**;
   * the bridge enforces no minimum interval, but consumers SHOULD
   * not call faster than 100 ms.
   *
   * @throws ARKitNotSupported on Android / Web / unsupported iOS.
   */
  readonly getSessionInfo: () => Promise<SessionInfo>;
}

// Re-export the entity types for the bridge consumer's convenience.
export type {
  PlaneDetectionMode,
  SessionState,
  TrackingState,
  ARKitConfiguration,
  AnchorRecord,
  SessionInfo,
};
