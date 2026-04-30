/**
 * characteristic-types.ts — HomeKit Lab (feature 044).
 *
 * Single source of truth for the canonical characteristic-kind union,
 * the auth-status enum, ordered catalogues, and pure helpers used by
 * tests. Mirrors the surface declared in `src/native/homekit.types.ts`
 * but stays independent of the native bridge so tests can reason
 * about UI logic without loading any native code.
 */

import type {
  CharacteristicEnumOption,
  CharacteristicKind,
  CharacteristicValue,
  HomeKitAuthStatus,
} from '@/native/homekit.types';

export type {
  CharacteristicEnumOption,
  CharacteristicKind,
  CharacteristicValue,
  HomeKitAuthStatus,
};

/** Stable order in which auth-status pills are rendered in tests. */
export const AUTH_STATUSES: readonly HomeKitAuthStatus[] = Object.freeze([
  'notDetermined',
  'authorized',
  'denied',
  'restricted',
]);

const STATUS_LABELS: Readonly<Record<HomeKitAuthStatus, string>> = Object.freeze({
  notDetermined: 'Not determined',
  authorized: 'Authorized',
  denied: 'Denied',
  restricted: 'Restricted',
});

export function labelForAuthStatus(status: HomeKitAuthStatus): string {
  return STATUS_LABELS[status];
}

/** Stable order of supported characteristic kinds. */
export const CHARACTERISTIC_KINDS: readonly CharacteristicKind[] = Object.freeze([
  'bool',
  'percent',
  'enum',
  'readonly',
]);

const KIND_LABELS: Readonly<Record<CharacteristicKind, string>> = Object.freeze({
  bool: 'Toggle',
  percent: 'Percent',
  enum: 'Picker',
  readonly: 'Read-only',
});

export function labelForKind(kind: CharacteristicKind): string {
  return KIND_LABELS[kind];
}

/**
 * Five-step segments rendered by the percent slider. Frozen so a
 * mutation in one render cycle cannot leak into the next.
 */
export const PERCENT_SEGMENTS: readonly number[] = Object.freeze([0, 25, 50, 75, 100]);

/**
 * Snap an arbitrary percent input (0–100) to the nearest segment.
 * Out-of-range inputs are clamped. Non-finite inputs return 0.
 */
export function snapPercent(input: number): number {
  if (!Number.isFinite(input)) return 0;
  const clamped = Math.max(0, Math.min(100, input));
  let best = PERCENT_SEGMENTS[0];
  let bestDelta = Math.abs(clamped - best);
  for (const seg of PERCENT_SEGMENTS) {
    const delta = Math.abs(clamped - seg);
    if (delta < bestDelta) {
      best = seg;
      bestDelta = delta;
    }
  }
  return best;
}

/**
 * Coerce an arbitrary value into a CharacteristicValue valid for the
 * given kind. Used by the editor to reject invalid writes early.
 *
 *   - bool: any → !!value (numbers > 0 → true, '' → false)
 *   - percent: any → snapped 0/25/50/75/100
 *   - enum: must match an option's `value`; otherwise returns null
 *   - readonly: always null (write rejected)
 */
export function coerceForKind(
  kind: CharacteristicKind,
  raw: unknown,
  options?: readonly CharacteristicEnumOption[],
): CharacteristicValue | null {
  switch (kind) {
    case 'bool':
      if (typeof raw === 'boolean') return raw;
      if (typeof raw === 'number') return raw > 0;
      if (typeof raw === 'string') return raw.toLowerCase() === 'true' || raw === '1';
      return null;
    case 'percent': {
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(num)) return null;
      return snapPercent(num);
    }
    case 'enum': {
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(num)) return null;
      if (!options || options.length === 0) return null;
      return options.some((o) => o.value === num) ? num : null;
    }
    case 'readonly':
      return null;
  }
}

/**
 * Format a characteristic value for display. Booleans → On/Off,
 * percent numbers → '50%', enum numbers → option label when known
 * else the raw number. Strings pass through.
 */
export function formatValue(
  kind: CharacteristicKind,
  value: CharacteristicValue | null | undefined,
  options?: readonly CharacteristicEnumOption[],
): string {
  if (value === null || value === undefined) return '—';
  switch (kind) {
    case 'bool':
      return value ? 'On' : 'Off';
    case 'percent':
      return `${typeof value === 'number' ? Math.round(value) : 0}%`;
    case 'enum': {
      if (typeof value !== 'number') return String(value);
      const opt = options?.find((o) => o.value === value);
      return opt ? opt.label : String(value);
    }
    case 'readonly':
      return String(value);
  }
}
