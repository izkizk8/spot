// src/modules/standby-lab/standby-config.ts
//
// StandBy widget configuration shared between the app and the widget
// extension via the same App Group `UserDefaults` suite established by
// feature 014, under the disjoint key namespace
// `spot.widget.standbyConfig.*` (FR-SB-021, FR-SB-048).
//
// @see specs/028-standby-mode/contracts/standby-config.contract.ts
// @see specs/028-standby-mode/data-model.md §3
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG as DEFAULT_WIDGET_CONFIG } from '@/modules/widgets-lab/widget-config';
import type { Tint } from '@/modules/widgets-lab/widget-config';

export type { Tint };

/**
 * The three rendering modes WidgetKit's StandBy / Smart Stack surface
 * documents. Mirrors Apple's `WidgetRenderingMode` enum cases
 * (`fullColor`, `accented`, `vibrant`).
 */
export type RenderingMode = 'fullColor' | 'accented' | 'vibrant';

export const RENDERING_MODES: readonly RenderingMode[] = [
  'fullColor',
  'accented',
  'vibrant',
] as const;

/**
 * The StandBy widget configuration. Adds the `mode` field on top of
 * 014/027's `{ showcaseValue, counter, tint }` shape (FR-SB-013, FR-SB-031).
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
 * (FR-SB-029).
 */
export const DEFAULT_STANDBY_CONFIG: StandByConfig = {
  showcaseValue: 'StandBy',
  counter: 0,
  tint: DEFAULT_WIDGET_CONFIG.tint,
  mode: 'fullColor',
};

/**
 * AsyncStorage shadow store key (FR-SB-048). Disjoint from 014's
 * `'widgets-lab:config'` and 027's `'spot.widget.lockConfig'`.
 */
export const SHADOW_STORE_KEY = 'spot.widget.standbyConfig' as const;

const VALID_TINTS: readonly Tint[] = ['blue', 'green', 'orange', 'pink'];
const SHOWCASE_MAX_LENGTH = 64;
const COUNTER_MIN = -9999;
const COUNTER_MAX = 9999;

/**
 * Pure function. Normalises an unknown payload into a valid
 * `StandByConfig`, applying defaults for missing/malformed fields and
 * clamping `counter` / capping `showcaseValue` length. MUST NOT throw.
 */
export function validate(input: unknown): StandByConfig {
  if (typeof input !== 'object' || input === null) {
    return DEFAULT_STANDBY_CONFIG;
  }

  const partial = input as Partial<StandByConfig>;

  let counter =
    typeof partial.counter === 'number' ? partial.counter : DEFAULT_STANDBY_CONFIG.counter;
  if (counter > COUNTER_MAX) counter = COUNTER_MAX;
  if (counter < COUNTER_MIN) counter = COUNTER_MIN;

  const tint = VALID_TINTS.includes(partial.tint as Tint)
    ? (partial.tint as Tint)
    : DEFAULT_STANDBY_CONFIG.tint;

  let showcaseValue =
    typeof partial.showcaseValue === 'string'
      ? partial.showcaseValue
      : DEFAULT_STANDBY_CONFIG.showcaseValue;
  if (showcaseValue.length > SHOWCASE_MAX_LENGTH) {
    showcaseValue = showcaseValue.slice(0, SHOWCASE_MAX_LENGTH);
  }

  const mode = RENDERING_MODES.includes(partial.mode as RenderingMode)
    ? (partial.mode as RenderingMode)
    : DEFAULT_STANDBY_CONFIG.mode;

  return {
    showcaseValue,
    counter,
    tint,
    mode,
  };
}

/**
 * Reads the standby-config from the AsyncStorage shadow store. Returns
 * `DEFAULT_STANDBY_CONFIG` on missing key, malformed JSON, or any
 * AsyncStorage error. MUST NOT throw.
 */
export async function loadShadowStandByConfig(): Promise<StandByConfig> {
  try {
    const json = await AsyncStorage.getItem(SHADOW_STORE_KEY);
    if (!json) return DEFAULT_STANDBY_CONFIG;
    const parsed = JSON.parse(json);
    return validate(parsed);
  } catch {
    return DEFAULT_STANDBY_CONFIG;
  }
}

/**
 * Writes the standby-config to the AsyncStorage shadow store. Silently
 * swallows AsyncStorage errors (preview path is non-blocking).
 */
export async function saveShadowStandByConfig(config: StandByConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(SHADOW_STORE_KEY, JSON.stringify(config));
  } catch {
    // Silent: non-blocking preview-only path
  }
}
