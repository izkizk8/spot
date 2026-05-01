/**
 * Contract: src/modules/lock-widgets-lab/lock-config.ts
 *
 * The TypeScript shape, defaults, AsyncStorage shadow store, and
 * validation surface for the lock-screen widget configuration.
 *
 * Stability: internal to this repo. Consumed by:
 *   - src/modules/lock-widgets-lab/screen{,.android,.web}.tsx
 *   - src/modules/lock-widgets-lab/components/* (StatusPanel, ConfigPanel,
 *     AccessoryPreview)
 *   - src/native/widget-center.ts (via the shared `Tint` import)
 *
 * Asserted by: test/unit/modules/lock-widgets-lab/lock-config.test.ts
 *
 * Spec refs: FR-LW-019, FR-LW-027, FR-LW-044.
 */

// IMPORTANT: `Tint` is re-imported from feature 014, not redefined here
// (FR-LW-012 + data-model.md §Tint).
import type { Tint } from '@/modules/widgets-lab/widget-config';

/**
 * The lock-screen widget configuration shared between the app and the
 * widget extension via the same App Group `UserDefaults` suite that
 * feature 014 established, under the DISJOINT key namespace
 * `spot.widget.lockConfig.*` (FR-LW-019).
 */
export interface LockConfig {
  /** Free-form headline. Defaults to "Hello, Lock!" (FR-LW-027). */
  showcaseValue: string;
  /** Signed integer; clamped to [-9999, 9999] at the input layer. */
  counter: number;
  /** One of the 4 documented swatches (re-imported from 014). */
  tint: Tint;
}

/**
 * Defaults exported as a const so tests can reference them directly
 * (FR-LW-027). MUST equal `{ showcaseValue: 'Hello, Lock!',
 * counter: 0, tint: <014-default-tint> }`.
 */
export declare const DEFAULT_LOCK_CONFIG: LockConfig;

/**
 * Pure function. Normalises an unknown payload (e.g. AsyncStorage
 * JSON parse output) into a valid `LockConfig`, applying defaults
 * for missing/malformed fields. MUST NOT throw.
 *
 * Behaviour MUST match 014's `validate()` shape:
 *   - non-string `showcaseValue` → `DEFAULT_LOCK_CONFIG.showcaseValue`
 *   - non-number `counter`      → `DEFAULT_LOCK_CONFIG.counter`
 *   - unknown `tint`            → `DEFAULT_LOCK_CONFIG.tint`
 */
export declare function validate(input: unknown): LockConfig;

/**
 * AsyncStorage shadow store key (FR-LW-044). MUST be the literal
 * string `'spot.widget.lockConfig'` and MUST be disjoint from 014's
 * `'widgets-lab:config'`.
 */
export declare const SHADOW_STORE_KEY: 'spot.widget.lockConfig';

/**
 * Reads the lock-config from the AsyncStorage shadow store. Returns
 * `DEFAULT_LOCK_CONFIG` on missing key, malformed JSON, or any
 * AsyncStorage error. MUST NOT throw.
 *
 * Used on Android / Web / iOS < 16 only; the iOS-16+ path reads
 * directly from the App Group via the `getLockConfig` bridge method.
 */
export declare function loadShadowLockConfig(): Promise<LockConfig>;

/**
 * Writes the lock-config to the AsyncStorage shadow store. Silently
 * swallows AsyncStorage errors (the preview path is non-blocking).
 * MUST NOT throw.
 */
export declare function saveShadowLockConfig(config: LockConfig): Promise<void>;
