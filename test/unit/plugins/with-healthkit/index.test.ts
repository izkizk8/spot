/**
 * Tests for with-healthkit Expo config plugin — feature 043.
 *
 * @jest-environment node
 */

import withHealthKit, {
  applyHealthKitEntitlement,
  applyHealthKitUsageStrings,
  DEFAULT_SHARE_COPY,
  DEFAULT_UPDATE_COPY,
  HEALTHKIT_ENTITLEMENT_KEY,
  HEALTHKIT_SHARE_KEY,
  HEALTHKIT_UPDATE_KEY,
} from '../../../../plugins/with-healthkit';
import type { ExpoConfig } from '@expo/config-types';

describe('with-healthkit (pure mutation: usage strings)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Row 1: missing keys → set to default copy, no warn', () => {
    const out = applyHealthKitUsageStrings({});
    expect(out[HEALTHKIT_SHARE_KEY]).toBe(DEFAULT_SHARE_COPY);
    expect(out[HEALTHKIT_UPDATE_KEY]).toBe(DEFAULT_UPDATE_COPY);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 2: developer-supplied non-empty strings are preserved verbatim', () => {
    const input = {
      [HEALTHKIT_SHARE_KEY]: 'My custom read copy',
      [HEALTHKIT_UPDATE_KEY]: 'My custom write copy',
    };
    const out = applyHealthKitUsageStrings(input);
    expect(out[HEALTHKIT_SHARE_KEY]).toBe('My custom read copy');
    expect(out[HEALTHKIT_UPDATE_KEY]).toBe('My custom write copy');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 3: empty-string values are replaced with default copy', () => {
    const out = applyHealthKitUsageStrings({
      [HEALTHKIT_SHARE_KEY]: '',
      [HEALTHKIT_UPDATE_KEY]: '',
    });
    expect(out[HEALTHKIT_SHARE_KEY]).toBe(DEFAULT_SHARE_COPY);
    expect(out[HEALTHKIT_UPDATE_KEY]).toBe(DEFAULT_UPDATE_COPY);
  });

  it('Row 4: non-string values are replaced with a one-time warn each', () => {
    const out = applyHealthKitUsageStrings({
      [HEALTHKIT_SHARE_KEY]: 42,
      [HEALTHKIT_UPDATE_KEY]: true,
    });
    expect(out[HEALTHKIT_SHARE_KEY]).toBe(DEFAULT_SHARE_COPY);
    expect(out[HEALTHKIT_UPDATE_KEY]).toBe(DEFAULT_UPDATE_COPY);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('Row 5: re-running on own output is byte-stable', () => {
    const once = applyHealthKitUsageStrings({});
    const twice = applyHealthKitUsageStrings(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyHealthKitUsageStrings(input);
    expect(out).not.toBe(input);
    expect(input[HEALTHKIT_SHARE_KEY]).toBeUndefined();
  });

  it('coexistence: leaves unrelated Info.plist keys verbatim', () => {
    const input: Record<string, unknown> = {
      NSCameraUsageDescription: 'Take photos',
      NSLocationWhenInUseUsageDescription: 'Show map',
      CFBundleDisplayName: 'Spot',
    };
    const out = applyHealthKitUsageStrings(input);
    expect(out.NSCameraUsageDescription).toBe('Take photos');
    expect(out.NSLocationWhenInUseUsageDescription).toBe('Show map');
    expect(out.CFBundleDisplayName).toBe('Spot');
  });
});

describe('with-healthkit (pure mutation: entitlement)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('sets the entitlement to true when missing, no warn', () => {
    const out = applyHealthKitEntitlement({});
    expect(out[HEALTHKIT_ENTITLEMENT_KEY]).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('preserves a prior boolean entitlement (idempotent, no warn)', () => {
    const out = applyHealthKitEntitlement({ [HEALTHKIT_ENTITLEMENT_KEY]: true });
    expect(out[HEALTHKIT_ENTITLEMENT_KEY]).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('replaces a non-boolean prior with true and warns once', () => {
    const out = applyHealthKitEntitlement({ [HEALTHKIT_ENTITLEMENT_KEY]: 'yes' });
    expect(out[HEALTHKIT_ENTITLEMENT_KEY]).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('is byte-stable on rerun', () => {
    const once = applyHealthKitEntitlement({});
    const twice = applyHealthKitEntitlement(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('coexistence: does not touch keychain-access-groups, app-groups, on-demand-install-capable', () => {
    const input: Record<string, unknown> = {
      'keychain-access-groups': ['$(AppIdentifierPrefix)com.example.app'],
      'com.apple.security.application-groups': ['group.com.example.app'],
      'com.apple.developer.on-demand-install-capable': true,
    };
    const out = applyHealthKitEntitlement(input);
    expect(out['keychain-access-groups']).toEqual(input['keychain-access-groups']);
    expect(out['com.apple.security.application-groups']).toEqual(
      input['com.apple.security.application-groups'],
    );
    expect(out['com.apple.developer.on-demand-install-capable']).toBe(true);
    expect(out[HEALTHKIT_ENTITLEMENT_KEY]).toBe(true);
  });
});

describe('with-healthkit (plugin wrapper)', () => {
  it('returns a valid ExpoConfig when applied', () => {
    const config: Partial<ExpoConfig> = { name: 'test', slug: 'test' };
    const modded = withHealthKit(config as ExpoConfig);
    expect(modded).toBeDefined();
    expect(modded.name).toBe('test');
  });

  it('app.json plugins array contains ./plugins/with-healthkit exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-healthkit',
    ).length;
    expect(count).toBe(1);
  });

  it('coexists in the plugin chain alongside with-app-clips, with-keychain-services, with-sign-in-with-apple without throwing', () => {
    const baseConfig: ExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      ios: { bundleIdentifier: 'com.test.app' },
    };
    const appClips = require('../../../../plugins/with-app-clips').default;
    const keychain = require('../../../../plugins/with-keychain-services').default;
    const siwa = require('../../../../plugins/with-sign-in-with-apple').default;
    const universalLinks = require('../../../../plugins/with-universal-links').default;

    let config = baseConfig;
    expect(() => {
      config = withHealthKit(config);
      config = appClips(config);
      config = keychain(config);
      config = siwa(config);
      config = universalLinks(config);
      // Re-run to check idempotency under composition
      config = withHealthKit(config);
      config = appClips(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });
});
