// src/modules/widgets-lab/widget-config.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Tint = 'blue' | 'green' | 'orange' | 'pink';

export const TINTS: readonly Tint[] = ['blue', 'green', 'orange', 'pink'] as const;

export interface WidgetConfig {
  /** Free-form headline string. Initialised to "Hello, Widget!". */
  showcaseValue: string;
  /** Signed integer; clamped to [-9999, 9999] at the input layer. */
  counter: number;
  /** One of the 4 documented swatches. Default 'blue'. */
  tint: Tint;
}

export const DEFAULT_CONFIG: WidgetConfig = {
  showcaseValue: 'Hello, Widget!',
  counter: 0,
  tint: 'blue',
};

const SHADOW_STORE_KEY = 'widgets-lab:config';

/**
 * Validates and normalizes a partial WidgetConfig, applying defaults and constraints.
 * - Clamps counter to [-9999, 9999]
 * - Falls back to default tint for unknown values
 * - Accepts any string for showcaseValue (including empty)
 */
export function validate(input: unknown): WidgetConfig {
  const partial = (input as Partial<WidgetConfig>) ?? {};

  let counter = typeof partial.counter === 'number' ? partial.counter : DEFAULT_CONFIG.counter;
  // Clamp to [-9999, 9999]
  if (counter > 9999) counter = 9999;
  if (counter < -9999) counter = -9999;

  const tint = TINTS.includes(partial.tint as Tint) ? (partial.tint as Tint) : DEFAULT_CONFIG.tint;

  const showcaseValue =
    typeof partial.showcaseValue === 'string'
      ? partial.showcaseValue
      : DEFAULT_CONFIG.showcaseValue;

  return {
    showcaseValue,
    counter,
    tint,
  };
}

/**
 * Load config from AsyncStorage shadow store (non-iOS-14+ platforms).
 * Returns DEFAULT_CONFIG if not found or parse fails.
 */
export async function loadShadowConfig(): Promise<WidgetConfig> {
  try {
    const json = await AsyncStorage.getItem(SHADOW_STORE_KEY);
    if (!json) return DEFAULT_CONFIG;
    const parsed = JSON.parse(json);
    return validate(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save config to AsyncStorage shadow store (non-iOS-14+ platforms).
 */
export async function saveShadowConfig(config: WidgetConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(SHADOW_STORE_KEY, JSON.stringify(config));
  } catch {
    // Silent failure — AsyncStorage write errors are non-blocking for preview-only path
  }
}
