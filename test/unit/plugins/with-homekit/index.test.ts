/**
 * Tests for with-homekit Expo config plugin — feature 044.
 *
 * @jest-environment node
 */

import withHomeKit, {
  applyHomeKitUsageString,
  DEFAULT_USAGE_COPY,
  HOMEKIT_USAGE_KEY,
} from '../../../../plugins/with-homekit';
import type { ExpoConfig } from '@expo/config-types';

describe('with-homekit (pure mutation: usage string)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Row 1: missing key → set to default copy, no warn', () => {
    const out = applyHomeKitUsageString({});
    expect(out[HOMEKIT_USAGE_KEY]).toBe(DEFAULT_USAGE_COPY);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 2: developer-supplied non-empty string is preserved verbatim', () => {
    const out = applyHomeKitUsageString({
      [HOMEKIT_USAGE_KEY]: 'My custom HomeKit copy',
    });
    expect(out[HOMEKIT_USAGE_KEY]).toBe('My custom HomeKit copy');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 3: empty-string value is replaced with default copy', () => {
    const out = applyHomeKitUsageString({ [HOMEKIT_USAGE_KEY]: '' });
    expect(out[HOMEKIT_USAGE_KEY]).toBe(DEFAULT_USAGE_COPY);
  });

  it('Row 4: non-string value is replaced with a one-time warn', () => {
    const out = applyHomeKitUsageString({ [HOMEKIT_USAGE_KEY]: 42 });
    expect(out[HOMEKIT_USAGE_KEY]).toBe(DEFAULT_USAGE_COPY);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('Row 5: re-running on own output is byte-stable', () => {
    const once = applyHomeKitUsageString({});
    const twice = applyHomeKitUsageString(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyHomeKitUsageString(input);
    expect(out).not.toBe(input);
    expect(input[HOMEKIT_USAGE_KEY]).toBeUndefined();
  });

  it('coexistence: leaves unrelated Info.plist keys verbatim', () => {
    const input: Record<string, unknown> = {
      NSCameraUsageDescription: 'Take photos',
      NSLocationWhenInUseUsageDescription: 'Show map',
      NSHealthShareUsageDescription: 'Read steps',
      CFBundleDisplayName: 'Spot',
    };
    const out = applyHomeKitUsageString(input);
    expect(out.NSCameraUsageDescription).toBe('Take photos');
    expect(out.NSLocationWhenInUseUsageDescription).toBe('Show map');
    expect(out.NSHealthShareUsageDescription).toBe('Read steps');
    expect(out.CFBundleDisplayName).toBe('Spot');
    expect(out[HOMEKIT_USAGE_KEY]).toBe(DEFAULT_USAGE_COPY);
  });
});

describe('with-homekit (plugin wrapper)', () => {
  it('returns a valid ExpoConfig when applied', () => {
    const config: Partial<ExpoConfig> = { name: 'test', slug: 'test' };
    const modded = withHomeKit(config as ExpoConfig);
    expect(modded).toBeDefined();
    expect(modded.name).toBe('test');
  });

  it('app.json plugins array contains ./plugins/with-homekit exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-homekit',
    ).length;
    expect(count).toBe(1);
  });

  it('coexists in the plugin chain alongside healthkit, app-clips, keychain, sign-in-with-apple, universal-links without throwing', () => {
    const baseConfig: ExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      ios: { bundleIdentifier: 'com.test.app' },
    };
    const healthkit = require('../../../../plugins/with-healthkit').default;
    const appClips = require('../../../../plugins/with-app-clips').default;
    const keychain = require('../../../../plugins/with-keychain-services').default;
    const siwa = require('../../../../plugins/with-sign-in-with-apple').default;
    const universalLinks = require('../../../../plugins/with-universal-links').default;

    let config = baseConfig;
    expect(() => {
      config = withHomeKit(config);
      config = healthkit(config);
      config = appClips(config);
      config = keychain(config);
      config = siwa(config);
      config = universalLinks(config);
      // Re-run to check idempotency under composition.
      config = withHomeKit(config);
      config = healthkit(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });
});
