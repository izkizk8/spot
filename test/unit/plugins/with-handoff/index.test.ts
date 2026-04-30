/**
 * Tests for with-handoff Expo config plugin — feature 040 / T007.
 *
 * @jest-environment node
 */

import withHandoff, { applyHandoffInfoPlist } from '../../../../plugins/with-handoff';
import {
  applySpotlightInfoPlist,
  ACTIVITY_TYPE as SPOTLIGHT_ACTIVITY_TYPE,
} from '../../../../plugins/with-spotlight';
import { HANDOFF_DEMO_ACTIVITY_TYPE } from '../../../../src/modules/handoff-lab/activity-types';
import type { ExpoConfig } from '@expo/config-types';

const USER_ACTIVITY_TYPES_KEY = 'NSUserActivityTypes';

function sortSet(xs: unknown): string {
  return Array.isArray(xs) ? [...xs].toSorted().join(',') : '';
}

describe('with-handoff (pure mutation)', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('Row 1: missing key → [HANDOFF_DEMO_ACTIVITY_TYPE]', () => {
    const out = applyHandoffInfoPlist({});
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([HANDOFF_DEMO_ACTIVITY_TYPE]);
  });

  it('Row 2: [] → [HANDOFF_DEMO_ACTIVITY_TYPE]', () => {
    const out = applyHandoffInfoPlist({
      [USER_ACTIVITY_TYPES_KEY]: [],
    });
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([HANDOFF_DEMO_ACTIVITY_TYPE]);
  });

  it('Row 3: [spot.showcase.activity] (031 ran first) → both entries', () => {
    const out = applyHandoffInfoPlist({
      [USER_ACTIVITY_TYPES_KEY]: [SPOTLIGHT_ACTIVITY_TYPE],
    });
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([
      SPOTLIGHT_ACTIVITY_TYPE,
      HANDOFF_DEMO_ACTIVITY_TYPE,
    ]);
  });

  it('Row 4: re-run on own output is byte-stable (idempotency)', () => {
    const once = applyHandoffInfoPlist({});
    const twice = applyHandoffInfoPlist(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('Row 5: both already present → identical (idempotency)', () => {
    const input = {
      [USER_ACTIVITY_TYPES_KEY]: [SPOTLIGHT_ACTIVITY_TYPE, HANDOFF_DEMO_ACTIVITY_TYPE],
    };
    const out = applyHandoffInfoPlist(input);
    expect(JSON.stringify(out)).toBe(JSON.stringify(input));
  });

  it('Row 6: non-array string → [HANDOFF_DEMO_ACTIVITY_TYPE] + console.warn', () => {
    const out = applyHandoffInfoPlist({
      [USER_ACTIVITY_TYPES_KEY]: 'not-an-array',
    });
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([HANDOFF_DEMO_ACTIVITY_TYPE]);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('with-handoff');
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('NSUserActivityTypes');
  });

  it('Row 7: null → [HANDOFF_DEMO_ACTIVITY_TYPE] + console.warn', () => {
    const out = applyHandoffInfoPlist({
      [USER_ACTIVITY_TYPES_KEY]: null,
    });
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([HANDOFF_DEMO_ACTIVITY_TYPE]);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it('Row 8: mixed [42, spot.showcase.activity, null] → [spot.showcase.activity, HANDOFF_DEMO_ACTIVITY_TYPE] (non-strings dropped)', () => {
    const out = applyHandoffInfoPlist({
      [USER_ACTIVITY_TYPES_KEY]: [42, SPOTLIGHT_ACTIVITY_TYPE, null],
    });
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([
      SPOTLIGHT_ACTIVITY_TYPE,
      HANDOFF_DEMO_ACTIVITY_TYPE,
    ]);
  });

  it('Coexistence with 031 (FR-005): H(S(x)) and S(H(x)) produce equal sets', () => {
    const input = {};
    const hs = applyHandoffInfoPlist(applySpotlightInfoPlist(input));
    const sh = applySpotlightInfoPlist(applyHandoffInfoPlist(input));
    expect(sortSet(hs[USER_ACTIVITY_TYPES_KEY])).toBe(sortSet(sh[USER_ACTIVITY_TYPES_KEY]));
    // Both contain both activity types
    expect((hs[USER_ACTIVITY_TYPES_KEY] as string[]).toSorted()).toEqual(
      [SPOTLIGHT_ACTIVITY_TYPE, HANDOFF_DEMO_ACTIVITY_TYPE].toSorted(),
    );
  });

  it('Order preservation (FR-003): prior entries remain at start', () => {
    const out = applyHandoffInfoPlist({
      [USER_ACTIVITY_TYPES_KEY]: ['a', 'b', 'c'],
    });
    expect((out[USER_ACTIVITY_TYPES_KEY] as string[]).slice(0, 3)).toEqual(['a', 'b', 'c']);
    expect((out[USER_ACTIVITY_TYPES_KEY] as string[])[3]).toBe(HANDOFF_DEMO_ACTIVITY_TYPE);
  });

  it('Immutability: returns new object, does not mutate input', () => {
    const input = {
      [USER_ACTIVITY_TYPES_KEY]: [SPOTLIGHT_ACTIVITY_TYPE],
    };
    const out = applyHandoffInfoPlist(input);
    expect(out).not.toBe(input);
    expect(input[USER_ACTIVITY_TYPES_KEY]).toEqual([SPOTLIGHT_ACTIVITY_TYPE]);
  });
});

describe('with-handoff (plugin wrapper)', () => {
  it('returns a valid ExpoConfig when applied', () => {
    const config: Partial<ExpoConfig> = { name: 'test', slug: 'test' };
    const modded = withHandoff(config as ExpoConfig);
    expect(modded).toBeDefined();
    expect(modded.name).toBe('test');
  });
});
