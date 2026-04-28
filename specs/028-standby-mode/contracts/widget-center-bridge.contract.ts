/**
 * Contract: src/native/widget-center.ts (and platform variants).
 *
 * Documents the ADDITIONS made by feature 028 to the JS bridge
 * established by feature 014 and extended by feature 027. Existing
 * exports — `isAvailable`, `getCurrentConfig`, `setConfig`,
 * `reloadAllTimelines`, `reloadTimelinesByKind`, `getLockConfig`,
 * `setLockConfig` — are unchanged and remain documented in
 * `specs/014-home-widgets/contracts/widget-center-bridge.md` and
 * `specs/027-lock-screen-widgets/contracts/widget-center-bridge.contract.ts`.
 *
 * Stability: internal to this repo. Consumed only by
 * `src/modules/standby-lab/`.
 *
 * Native module name: `SpotWidgetCenter` (lives in the MAIN APP
 * target, not the widget extension — same as 014 / 027).
 *
 * Asserted by: test/unit/native/widget-center-standby.test.ts.
 *
 * Spec refs: FR-SB-022, FR-SB-023, FR-SB-024.
 */

import type { StandByConfig } from './standby-config.contract';
import type { WidgetCenterBridge as BaseBridge } from '@/native/widget-center.types';

/**
 * The 028-extended bridge. ALL existing `BaseBridge` symbols MUST
 * remain exported and behave exactly as features 014 and 027
 * documented. 028 does NOT add a new reload symbol — it reuses
 * the existing `reloadTimelinesByKind(kind: string)` symbol added
 * by 027 (FR-SB-024) with the kind identifier `"SpotStandByWidget"`.
 */
export interface WidgetCenterBridgeWithStandByConfig extends BaseBridge {
  /**
   * Reads the standby-config from the App Group `UserDefaults` suite
   * under the `spot.widget.standbyConfig.*` key namespace
   * (FR-SB-022 / FR-SB-021). Returns `DEFAULT_STANDBY_CONFIG` when
   * the suite has no keys under that namespace or any individual
   * key is missing/malformed.
   *
   * Errors:
   * | Condition                                                 | Error                              |
   * |-----------------------------------------------------------|------------------------------------|
   * | Platform.OS !== 'ios' OR iOS < 17 OR native module missing | `WidgetCenterNotSupportedError`    |
   * | Native rejection with code `NOT_SUPPORTED`                 | `WidgetCenterNotSupportedError`    |
   * | Native rejection with any other code                       | `WidgetCenterBridgeError(message)` |
   */
  getStandByConfig(): Promise<StandByConfig>;

  /**
   * Writes the supplied standby-config to the App Group
   * `UserDefaults` suite under the `spot.widget.standbyConfig.*`
   * key namespace (FR-SB-022). All four keys (showcaseValue,
   * counter, tint, mode) are written in a single transaction.
   * Caller is responsible for `validate()`-ing first.
   *
   * The bridge defends against unknown `tint` and unknown `mode`
   * values (rejects with `WidgetCenterBridgeError`) so a malformed
   * push cannot corrupt the App Group state.
   *
   * Errors:
   *   - Non-iOS-17+         → `WidgetCenterNotSupportedError`
   *   - Native write failure → `WidgetCenterBridgeError(message)`
   */
  setStandByConfig(config: StandByConfig): Promise<void>;
}

/**
 * Required test cases for `widget-center-standby.test.ts`:
 *
 * 1. On `Platform.OS === 'web'`:
 *    a. `getStandByConfig()` rejects with `WidgetCenterNotSupportedError`.
 *    b. `setStandByConfig(STANDBY_CONFIG)` rejects with
 *       `WidgetCenterNotSupportedError`.
 *    c. `isAvailable()` returns `false` and does not throw.
 * 2. On `Platform.OS === 'android'`: same 3 assertions as web.
 * 3. On `Platform.OS === 'ios'` with native module mocked + iOS ≥ 17:
 *    a. `getStandByConfig()` resolves with the mocked module's
 *       response (verifying all four fields including `mode`
 *       round-trip).
 *    b. `setStandByConfig(c)` calls through with the same payload.
 *    c. `reloadTimelinesByKind('SpotStandByWidget')` calls through
 *       with the exact kind string and resolves (re-asserts 027's
 *       contract; ensures 028 does NOT introduce a parallel reload
 *       symbol per FR-SB-024).
 *    d. A native rejection with code `NOT_SUPPORTED` surfaces as
 *       `WidgetCenterNotSupportedError`.
 *    e. A native rejection with any other code surfaces as
 *       `WidgetCenterBridgeError`.
 *    f. `setStandByConfig` with `mode: 'unknown' as RenderingMode`
 *       rejects with `WidgetCenterBridgeError` (defensive validation
 *       at the bridge boundary).
 * 4. On `Platform.OS === 'ios'` with iOS < 17 (mocked
 *    Platform.Version):
 *    a. `getStandByConfig` rejects with `WidgetCenterNotSupportedError`.
 *    b. `setStandByConfig` rejects with `WidgetCenterNotSupportedError`.
 *    c. `isAvailable()` returns `false`.
 * 5. Existing 014 / 027 tests MUST still pass after the additions
 *    (regression). The bridge mocks used by 014 / 027 tests must
 *    be updated to stub `getStandByConfig` / `setStandByConfig` —
 *    those stubs throw `NOT_SUPPORTED` if invoked from a 014 / 027
 *    test path.
 * 6. `reloadTimelinesByKind('SpotStandByWidget')` is the ONLY
 *    reload call site introduced by 028; assert via grep / static
 *    inspection that no `reloadStandByTimelines` symbol exists
 *    anywhere in `src/native/widget-center.*` (FR-SB-024).
 */
export declare const TEST_OBLIGATIONS: readonly string[];
