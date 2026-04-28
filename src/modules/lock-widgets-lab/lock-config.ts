// src/modules/lock-widgets-lab/lock-config.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG as DEFAULT_WIDGET_CONFIG } from '@/modules/widgets-lab/widget-config';
import type { Tint } from '@/modules/widgets-lab/widget-config';

export type { Tint };

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
export const DEFAULT_LOCK_CONFIG: LockConfig = {
  showcaseValue: 'Hello, Lock!',
  counter: 0,
  tint: DEFAULT_WIDGET_CONFIG.tint,
};

/**
 * AsyncStorage shadow store key (FR-LW-044). MUST be the literal
 * string `'spot.widget.lockConfig'` and MUST be disjoint from 014's
 * `'widgets-lab:config'`.
 */
export const SHADOW_STORE_KEY = 'spot.widget.lockConfig' as const;

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
export function validate(input: unknown): LockConfig {
  if (typeof input !== 'object' || input === null) {
    return DEFAULT_LOCK_CONFIG;
  }

  const partial = input as Partial<LockConfig>;

  let counter = typeof partial.counter === 'number' ? partial.counter : DEFAULT_LOCK_CONFIG.counter;
  // Clamp to [-9999, 9999]
  if (counter > 9999) counter = 9999;
  if (counter < -9999) counter = -9999;

  const validTints: Tint[] = ['blue', 'green', 'orange', 'pink'];
  const tint = validTints.includes(partial.tint as Tint)
    ? (partial.tint as Tint)
    : DEFAULT_LOCK_CONFIG.tint;

  const showcaseValue =
    typeof partial.showcaseValue === 'string'
      ? partial.showcaseValue
      : DEFAULT_LOCK_CONFIG.showcaseValue;

  return {
    showcaseValue,
    counter,
    tint,
  };
}

/**
 * Reads the lock-config from the AsyncStorage shadow store. Returns
 * `DEFAULT_LOCK_CONFIG` on missing key, malformed JSON, or any
 * AsyncStorage error. MUST NOT throw.
 *
 * Used on Android / Web / iOS < 16 only; the iOS-16+ path reads
 * directly from the App Group via the `getLockConfig` bridge method.
 */
export async function loadShadowLockConfig(): Promise<LockConfig> {
  try {
    const json = await AsyncStorage.getItem(SHADOW_STORE_KEY);
    if (!json) return DEFAULT_LOCK_CONFIG;
    const parsed = JSON.parse(json);
    return validate(parsed);
  } catch {
    return DEFAULT_LOCK_CONFIG;
  }
}

/**
 * Writes the lock-config to the AsyncStorage shadow store. Silently
 * swallows AsyncStorage errors (the preview path is non-blocking).
 * MUST NOT throw.
 */
export async function saveShadowLockConfig(config: LockConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(SHADOW_STORE_KEY, JSON.stringify(config));
  } catch {
    // Silent failure — AsyncStorage write errors are non-blocking for preview-only path
  }
}
