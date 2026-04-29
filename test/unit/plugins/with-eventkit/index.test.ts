/**
 * with-eventkit plugin — unit tests.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/with-eventkit-plugin.md
 */

import type { ExpoConfig } from '@expo/config-types';

jest.mock('@expo/config-plugins', () => {
  const actual = jest.requireActual('@expo/config-plugins');
  return {
    ...actual,
    withInfoPlist: (
      config: { ios?: { infoPlist?: Record<string, unknown> } } & Record<string, unknown>,
      callback: (cfg: { modResults: Record<string, unknown> }) => {
        modResults: Record<string, unknown>;
      },
    ) => {
      const modResults: Record<string, unknown> = { ...config.ios?.infoPlist };
      const result = callback({ modResults } as unknown as { modResults: Record<string, unknown> });
      return {
        ...config,
        ios: {
          ...config.ios,
          infoPlist: result.modResults,
        },
      };
    },
  };
});

const KEYS = [
  'NSCalendarsUsageDescription',
  'NSCalendarsWriteOnlyAccessUsageDescription',
  'NSRemindersUsageDescription',
  'NSRemindersFullAccessUsageDescription',
] as const;

describe('with-eventkit plugin', () => {
  let withEventKit: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    withEventKit = require('../../../../plugins/with-eventkit').default;
  });

  it('P1: default export is a ConfigPlugin function', () => {
    expect(typeof withEventKit).toBe('function');
  });

  it('P2: empty config sets all four keys to non-empty default strings', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const result = withEventKit(config);

    for (const key of KEYS) {
      const value = result.ios?.infoPlist?.[key];
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    }
  });

  it('P3: preserves pre-populated usage description values', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      ios: {
        infoPlist: {
          NSCalendarsUsageDescription: 'Custom calendar reason',
          NSRemindersUsageDescription: 'Custom reminders reason',
        },
      },
    };

    const result = withEventKit(config);

    expect(result.ios?.infoPlist?.NSCalendarsUsageDescription).toBe('Custom calendar reason');
    expect(result.ios?.infoPlist?.NSRemindersUsageDescription).toBe('Custom reminders reason');
    // The two unset keys still receive defaults.
    expect(typeof result.ios?.infoPlist?.NSCalendarsWriteOnlyAccessUsageDescription).toBe('string');
    expect(typeof result.ios?.infoPlist?.NSRemindersFullAccessUsageDescription).toBe('string');
  });

  it('P4: does not write any foreign Info.plist keys', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const result = withEventKit(config);

    const writtenKeys = Object.keys(result.ios?.infoPlist ?? {});
    for (const key of writtenKeys) {
      expect(KEYS).toContain(key as (typeof KEYS)[number]);
    }
    expect(writtenKeys.sort()).toEqual([...KEYS].sort());
  });

  it('P5: running plugin twice is idempotent (deep-equal)', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const first = withEventKit(config);
    const second = withEventKit(first);
    expect(second).toEqual(first);
  });

  it('P7: does not touch ios.entitlements', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      ios: {
        entitlements: {
          'aps-environment': 'production',
          'com.apple.developer.siri': true,
        },
      },
    };

    const result = withEventKit(config);

    expect(result.ios?.entitlements?.['aps-environment']).toBe('production');
    expect(result.ios?.entitlements?.['com.apple.developer.siri']).toBe(true);
    expect(Object.keys(result.ios?.entitlements ?? {}).sort()).toEqual(
      ['aps-environment', 'com.apple.developer.siri'].sort(),
    );
  });
});
