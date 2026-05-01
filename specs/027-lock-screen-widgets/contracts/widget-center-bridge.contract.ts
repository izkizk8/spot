/**
 * Contract: src/native/widget-center.ts (and platform variants).
 *
 * Documents the ADDITIONS made by feature 027 to the JS bridge
 * established by feature 014. Existing exports — `isAvailable`,
 * `getCurrentConfig`, `setConfig`, `reloadAllTimelines` — are
 * unchanged and remain documented in
 * `specs/014-home-widgets/contracts/widget-center-bridge.md`.
 *
 * Stability: internal to this repo. Consumed only by
 * `src/modules/lock-widgets-lab/`.
 *
 * Native module name: `SpotWidgetCenter` (lives in the MAIN APP
 * target, not the widget extension — same as 014).
 *
 * Asserted by: test/unit/native/widget-center-by-kind.test.ts.
 *
 * Spec refs: FR-LW-020, FR-LW-021, FR-LW-022, FR-LW-028.
 */

import type { LockConfig } from './lock-config.contract';
import type { WidgetCenterBridge as BaseBridge } from '@/native/widget-center.types';

/**
 * The 027-extended bridge. ALL existing `BaseBridge` symbols MUST
 * remain exported and behave exactly as feature 014 documented.
 */
export interface WidgetCenterBridgeWithLockConfig extends BaseBridge {
  /**
   * Per-kind timeline reload (FR-LW-020 / FR-LW-028). On iOS 16+
   * delegates to `WidgetCenter.shared.reloadTimelines(ofKind: kind)`
   * on the native side. Resolves once the call has been *issued*
   * (not once any widget has actually re-rendered — that's
   * WidgetKit's prerogative).
   *
   * Resolving on a kind with no installed widget instances is a
   * successful no-op (Edge Case "No widget installed when Push is
   * tapped").
   *
   * Errors:
   * | Condition                                                  | Error                              |
   * |------------------------------------------------------------|------------------------------------|
   * | Platform.OS !== 'ios' OR iOS < 16 OR native module missing | `WidgetCenterNotSupportedError`    |
   * | Native rejection with code `NOT_SUPPORTED`                 | `WidgetCenterNotSupportedError`   |
   * | Native rejection with any other code                       | `WidgetCenterBridgeError(message)` |
   */
  reloadTimelinesByKind(kind: string): Promise<void>;

  /**
   * Reads the lock-config from the App Group `UserDefaults` suite
   * under the `spot.widget.lockConfig.*` key namespace (FR-LW-022 /
   * FR-LW-019). Returns `DEFAULT_LOCK_CONFIG` when the suite has no
   * keys under that namespace or any individual key is
   * missing/malformed.
   *
   * Errors: same shape as `getCurrentConfig` for 014.
   *   - Non-iOS-16+        → `WidgetCenterNotSupportedError`
   *   - Native suite read  → `WidgetCenterBridgeError(message)`
   */
  getLockConfig(): Promise<LockConfig>;

  /**
   * Writes the supplied lock-config to the App Group `UserDefaults`
   * suite under the `spot.widget.lockConfig.*` key namespace
   * (FR-LW-022). Caller is responsible for `validate()`-ing first.
   * The bridge defends against unknown `tint` values (rejects with
   * `WidgetCenterBridgeError`).
   *
   * Errors:
   *   - Non-iOS-16+         → `WidgetCenterNotSupportedError`
   *   - Native write failure → `WidgetCenterBridgeError(message)`
   */
  setLockConfig(config: LockConfig): Promise<void>;
}

/**
 * Required test cases for `widget-center-by-kind.test.ts`:
 *
 * 1. On `Platform.OS === 'web'`:
 *    a. `reloadTimelinesByKind('SpotLockScreenWidget')` rejects with
 *       `WidgetCenterNotSupportedError`.
 *    b. `getLockConfig()` rejects with `WidgetCenterNotSupportedError`.
 *    c. `setLockConfig(LOCK_CONFIG)` rejects with `WidgetCenterNotSupportedError`.
 *    d. `isAvailable()` returns `false` and does not throw.
 * 2. On `Platform.OS === 'android'`: same 4 assertions as web.
 * 3. On `Platform.OS === 'ios'` with native module mocked + iOS ≥ 16:
 *    a. `reloadTimelinesByKind('SpotLockScreenWidget')` calls through with
 *       the exact kind string and resolves.
 *    b. `getLockConfig()` resolves with the mocked module's response.
 *    c. `setLockConfig(c)` calls through with the same payload.
 *    d. A native rejection with code `NOT_SUPPORTED` surfaces as
 *       `WidgetCenterNotSupportedError`.
 *    e. A native rejection with any other code surfaces as
 *       `WidgetCenterBridgeError`.
 * 4. On `Platform.OS === 'ios'` with iOS < 16 (mocked Platform.Version):
 *    a. `reloadTimelinesByKind` rejects with `WidgetCenterNotSupportedError`.
 *    b. `isAvailable()` returns `false`.
 * 5. Existing 014 tests MUST still pass after the additions (regression).
 */
export declare const TEST_OBLIGATIONS: readonly string[];
