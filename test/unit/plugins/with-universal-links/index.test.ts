/**
 * Tests for with-universal-links Expo config plugin — feature 041.
 *
 * @jest-environment node
 */

import withUniversalLinks, {
  applyAssociatedDomains,
  DEMO_DOMAIN,
} from '../../../../plugins/with-universal-links';
import type { ExpoConfig } from '@expo/config-types';

const KEY = 'com.apple.developer.associated-domains';

describe('with-universal-links (pure mutation)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Row 1: missing key → [DEMO_DOMAIN]', () => {
    const out = applyAssociatedDomains({});
    expect(out[KEY]).toEqual([DEMO_DOMAIN]);
  });

  it('Row 2: [] → [DEMO_DOMAIN]', () => {
    const out = applyAssociatedDomains({ [KEY]: [] });
    expect(out[KEY]).toEqual([DEMO_DOMAIN]);
  });

  it('Row 3: prior real domain preserved → [prior, DEMO_DOMAIN]', () => {
    const prior = 'applinks:my.real.example.com';
    const out = applyAssociatedDomains({ [KEY]: [prior] });
    expect(out[KEY]).toEqual([prior, DEMO_DOMAIN]);
  });

  it('Row 4: re-run on own output is byte-stable (idempotency)', () => {
    const once = applyAssociatedDomains({});
    const twice = applyAssociatedDomains(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('Row 5: DEMO_DOMAIN already present → identical (idempotency)', () => {
    const input = { [KEY]: [DEMO_DOMAIN] };
    const out = applyAssociatedDomains(input);
    expect(JSON.stringify(out)).toBe(JSON.stringify(input));
  });

  it('Row 6: non-array → [DEMO_DOMAIN] + console.warn', () => {
    const out = applyAssociatedDomains({ [KEY]: 'not-an-array' });
    expect(out[KEY]).toEqual([DEMO_DOMAIN]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('with-universal-links');
  });

  it('Row 7: null → [DEMO_DOMAIN] + console.warn', () => {
    const out = applyAssociatedDomains({ [KEY]: null });
    expect(out[KEY]).toEqual([DEMO_DOMAIN]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('Row 8: mixed [42, prior, null] → [prior, DEMO_DOMAIN] (non-strings dropped)', () => {
    const prior = 'applinks:keep.example.com';
    const out = applyAssociatedDomains({ [KEY]: [42, prior, null] });
    expect(out[KEY]).toEqual([prior, DEMO_DOMAIN]);
  });

  it('Order preservation: prior entries remain at start', () => {
    const out = applyAssociatedDomains({
      [KEY]: ['applinks:a.example', 'applinks:b.example', 'applinks:c.example'],
    });
    const arr = out[KEY] as string[];
    expect(arr.slice(0, 3)).toEqual([
      'applinks:a.example',
      'applinks:b.example',
      'applinks:c.example',
    ]);
    expect(arr[3]).toBe(DEMO_DOMAIN);
  });

  it('Immutability: returns new object, does not mutate input', () => {
    const prior = ['applinks:keep.example.com'];
    const input = { [KEY]: prior };
    const out = applyAssociatedDomains(input);
    expect(out).not.toBe(input);
    expect(input[KEY]).toBe(prior);
    expect(prior).toEqual(['applinks:keep.example.com']);
  });

  it('Coexistence: does not touch keychain-access-groups or aps-environment keys', () => {
    const input = {
      'keychain-access-groups': ['$(AppIdentifierPrefix)com.example.app'],
      'aps-environment': 'development',
    };
    const out = applyAssociatedDomains(input);
    expect(out['keychain-access-groups']).toEqual(input['keychain-access-groups']);
    expect(out['aps-environment']).toBe('development');
    expect(out[KEY]).toEqual([DEMO_DOMAIN]);
  });
});

describe('with-universal-links (plugin wrapper)', () => {
  it('returns a valid ExpoConfig when applied', () => {
    const config: Partial<ExpoConfig> = { name: 'test', slug: 'test' };
    const modded = withUniversalLinks(config as ExpoConfig);
    expect(modded).toBeDefined();
    expect(modded.name).toBe('test');
  });

  it('app.json plugins array contains ./plugins/with-universal-links exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-universal-links',
    ).length;
    expect(count).toBe(1);
  });
});
