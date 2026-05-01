/**
 * Contract: src/modules/standby-lab/standby-config.ts
 *
 * The TypeScript shape, defaults, AsyncStorage shadow store, and
 * validation surface for the StandBy widget configuration.
 *
 * Stability: internal to this repo. Consumed by:
 *   - src/modules/standby-lab/screen{,.android,.web}.tsx
 *   - src/modules/standby-lab/components/*  (StandByConfigPanel,
 *     RenderingModePicker, StandByPreview)
 *   - src/native/widget-center.ts (via the shared `StandByConfig`
 *     re-export)
 *
 * Asserted by: test/unit/modules/standby-lab/standby-config.test.ts
 *
 * Spec refs: FR-SB-013, FR-SB-021, FR-SB-029, FR-SB-031, FR-SB-048.
 */

// IMPORTANT: `Tint` is re-imported from feature 014, not redefined here
// (FR-SB-013 + data-model.md §3).
import type { Tint } from '@/modules/widgets-lab/widget-config';

/**
 * The three rendering modes WidgetKit's StandBy / Smart Stack
 * surfaces document. Mirrors Apple's `WidgetRenderingMode` enum
 * cases (`fullColor`, `accented`, `vibrant`).
 *
 * The user-selected value is the user's PREFERRED preview mode and
 * the persisted on-device preference; the system independently
 * decides what `widgetRenderingMode` to set at render time
 * (research.md §1).
 */
export type RenderingMode = 'fullColor' | 'accented' | 'vibrant';

/**
 * The StandBy widget configuration shared between the app and the
 * widget extension via the same App Group `UserDefaults` suite that
 * feature 014 established and 027 already reuses, under the THIRD
 * DISJOINT key namespace `spot.widget.standbyConfig.*` (FR-SB-021).
 *
 * Adds the `mode` field on top of 014/027's
 * `{ showcaseValue, counter, tint }` shape.
 */
export interface StandByConfig {
  /** Free-form headline. Defaults to "StandBy" (FR-SB-029). */
  showcaseValue: string;
  /** Signed integer; clamped to [-9999, 9999] at the input layer. */
  counter: number;
  /** One of the 4 documented swatches (re-imported from 014). */
  tint: Tint;
  /** User's preferred StandBy rendering treatment (FR-SB-031). */
  mode: RenderingMode;
}

/**
 * Defaults exported as a const so tests can reference them directly
 * (FR-SB-029). MUST equal:
 *   { showcaseValue: 'StandBy', counter: 0,
 *     tint: <014-default-tint>, mode: 'fullColor' }.
 */
export declare const DEFAULT_STANDBY_CONFIG: StandByConfig;

/**
 * Pure function. Normalises an unknown payload (e.g. AsyncStorage
 * JSON parse output, or an App Group read) into a valid
 * `StandByConfig`, applying defaults for missing/malformed fields.
 * MUST NOT throw.
 *
 * Behaviour MUST match 014 / 027's `validate()` shape, plus:
 *   - non-string `showcaseValue` → DEFAULT.showcaseValue
 *   - `showcaseValue` longer than 64 chars → first 64 chars
 *   - non-number `counter`        → DEFAULT.counter
 *   - `counter` outside [-9999, 9999] → clamped
 *   - unknown `tint`              → DEFAULT.tint
 *   - `mode` not in {'fullColor','accented','vibrant'} → DEFAULT.mode
 */
export declare function validate(input: unknown): StandByConfig;

/**
 * AsyncStorage shadow store key (FR-SB-048). MUST be the literal
 * string `'spot.widget.standbyConfig'` and MUST be disjoint from
 * 014's `'widgets-lab:config'` and 027's `'spot.widget.lockConfig'`.
 */
export declare const SHADOW_STORE_KEY: 'spot.widget.standbyConfig';

/**
 * Reads the standby-config from the AsyncStorage shadow store.
 * Returns `DEFAULT_STANDBY_CONFIG` on missing key, malformed JSON,
 * or any AsyncStorage error. MUST NOT throw.
 *
 * Used on Android / Web / iOS < 17 only; the iOS-17+ path reads
 * directly from the App Group via the `getStandByConfig` bridge
 * method.
 */
export declare function loadShadowStandByConfig(): Promise<StandByConfig>;

/**
 * Writes the standby-config to the AsyncStorage shadow store.
 * Silently swallows AsyncStorage errors (the preview path is
 * non-blocking). MUST NOT throw.
 */
export declare function saveShadowStandByConfig(
  config: StandByConfig,
): Promise<void>;
