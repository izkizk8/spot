/**
 * Contract: native iOS Expo Module surfaces for ARKit Basics.
 *
 * @feature 034-arkit-basics
 * @see specs/034-arkit-basics/spec.md FR-005, FR-007 .. FR-014
 * @see specs/034-arkit-basics/data-model.md Entities 1–6
 * @see specs/034-arkit-basics/research.md §2 (R-B raycast),
 *      §3 (R-C lifecycle), §5 (R-E FPS), §7 (R-G reset)
 *
 * Implementation files:
 *   - native/ios/arkit/ARKitBridge.swift  (imperative Module)
 *   - native/ios/arkit/ARKitView.swift    (ViewDefinition)
 *   - native/ios/arkit/Resources/cube-texture.png
 *
 * This file documents the JS-visible Expo Module surface that the
 * Swift sources MUST expose. There are no JS unit tests for this
 * file — Swift cannot be exercised on Windows. On-device verification
 * is documented in `quickstart.md`.
 *
 * INVARIANTS (verified on-device per quickstart.md):
 *   N1. `ARKitBridge` Module name is the literal string 'ARKitBridge'.
 *       `ARKitView` ViewDefinition name is the literal string
 *       'ARKitView'.
 *   N2. The five AsyncFunctions (`placeAnchorAt`, `clearAnchors`,
 *       `pauseSession`, `resumeSession`, `getSessionInfo`) return
 *       Promises to JS. `isAvailable` is registered as `Function`
 *       (synchronous return) and reads
 *       `ARWorldTrackingConfiguration.isSupported`.
 *   N3. `placeAnchorAt(x, y)` resolves with `null` (or `Void` /
 *       undefined on the JS side); the AnchorRecord is delivered via
 *       the ViewDefinition's `onAnchorAdded` event (single source of
 *       truth).
 *   N4. `clearAnchors()` removes every anchor added through
 *       `placeAnchorAt` and emits `onAnchorRemoved` for each.
 *   N5. `pauseSession()` / `resumeSession()` are idempotent. Pause
 *       freezes the duration counter; resume continues from the
 *       value at pause.
 *   N6. `getSessionInfo()` resolves with the SessionInfo shape
 *       (data-model Entity 6) computed at call time. The FPS field
 *       is the count of ARSession frames received in the last 1.0 s
 *       (R-E ring buffer of the last 60 timestamps).
 *   N7. The bridge looks up the active `ARKitView` via
 *       `ARKitViewRegistry.shared.active()`. If `nil`, every
 *       AsyncFunction rejects with code `'no-active-view'`. The hook
 *       treats this as a transient (R-D).
 *   N8. The cube texture asset (`cube-texture.png`) is bundled via
 *       the Expo Module's `Resources(...)` directive. On load
 *       failure, the cube falls back to `SimpleMaterial(color:
 *       .white)`; the bridge MUST NOT reject for this.
 *   N9. The plugin guarantees the device's
 *       `UIRequiredDeviceCapabilities` Info.plist key contains
 *       `'arkit'` exactly once and `NSCameraUsageDescription` is
 *       non-empty (see plugin.contract.ts).
 *
 * Pseudo-signature of `ARKitBridge.swift`:
 *
 *   Module("ARKitBridge") {
 *     AsyncFunction("placeAnchorAt") { (x: Double, y: Double, promise: Promise) -> Void }
 *     AsyncFunction("clearAnchors") { (promise: Promise) -> Void }
 *     AsyncFunction("pauseSession") { (promise: Promise) -> Void }
 *     AsyncFunction("resumeSession") { (promise: Promise) -> Void }
 *     AsyncFunction("getSessionInfo") { (promise: Promise) -> Void }
 *     Function("isAvailable") { () -> Bool }
 *   }
 *
 * Error codes surfaced via `promise.reject(code, message)`:
 *   - 'no-active-view'         (no ARKitView registered)
 *   - 'session-not-running'    (placeAnchorAt called while paused/idle)
 *   - 'raycast-failed'         (RealityKit raycast threw — RARE)
 *   - 'unavailable'            (iOS device without world tracking)
 */

export type ARKitBridgeNativeModule = {
  readonly placeAnchorAt: (x: number, y: number) => Promise<void>;
  readonly clearAnchors: () => Promise<void>;
  readonly pauseSession: () => Promise<void>;
  readonly resumeSession: () => Promise<void>;
  readonly getSessionInfo: () => Promise<{
    readonly state: 'idle' | 'running' | 'paused' | 'error';
    readonly anchorCount: number;
    readonly fps: number;
    readonly duration: number;
    readonly trackingState: string;
    readonly lastError?: string;
  }>;
  readonly isAvailable: () => boolean;
};
