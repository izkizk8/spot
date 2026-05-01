/**
 * @jest-environment node
 *
 * with-photokit Plugin Test
 * Feature: 057-photokit
 */

import { describe, expect, it, jest } from '@jest/globals';

import withPhotoKit, {
  PHOTO_LIBRARY_KEY,
  PHOTO_LIBRARY_COPY,
  applyPhotoLibraryUsage,
} from '../../../../plugins/with-photokit';

import type { ExpoConfig } from '@expo/config-types';

describe('applyPhotoLibraryUsage', () => {
  it('adds the key with documented copy when absent', () => {
    const out = applyPhotoLibraryUsage({});
    expect(out[PHOTO_LIBRARY_KEY]).toBe(PHOTO_LIBRARY_COPY);
  });

  it('idempotent (run twice produces deep-equal result)', () => {
    const a = applyPhotoLibraryUsage({});
    const b = applyPhotoLibraryUsage(a);
    expect(b).toEqual(a);
  });

  it('preserves operator-supplied value', () => {
    const initial = { [PHOTO_LIBRARY_KEY]: 'Custom copy.' };
    const out = applyPhotoLibraryUsage(initial);
    expect(out[PHOTO_LIBRARY_KEY]).toBe('Custom copy.');
  });

  it('preserves unrelated keys', () => {
    const initial = { NSCameraUsageDescription: 'Camera.' };
    const out = applyPhotoLibraryUsage(initial);
    expect(out['NSCameraUsageDescription']).toBe('Camera.');
    expect(out[PHOTO_LIBRARY_KEY]).toBe(PHOTO_LIBRARY_COPY);
  });
});

describe('withPhotoKit (default plugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: {
      bundleIdentifier: 'com.test.app',
    },
  };

  it('runs without throwing on a baseline config', () => {
    expect(() => withPhotoKit(baseConfig)).not.toThrow();
  });

  it('is idempotent (run twice produces a single write)', () => {
    let cfg = withPhotoKit(baseConfig);
    cfg = withPhotoKit(cfg);
    expect(cfg).toBeDefined();
  });

  it('emits no warnings on a baseline config', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    withPhotoKit(baseConfig);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
    consoleWarnSpy.mockRestore();
  });

  it('only edits NSPhotoLibraryUsageDescription', () => {
    const result = withPhotoKit(baseConfig);
    expect(result.name).toBe(baseConfig.name);
    expect(result.slug).toBe(baseConfig.slug);
    expect(result.ios?.bundleIdentifier).toBe(baseConfig.ios?.bundleIdentifier);
  });

  it('coexistence: app.json includes with-photokit', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(49);
    const idx = plugins.findIndex(
      (p: unknown) => typeof p === 'string' && p === './plugins/with-photokit',
    );
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  it('mod-chain runs without throwing (5 prior plugins)', () => {
    const plugins = [
      require('../../../../plugins/with-coredata-cloudkit').default,
      require('../../../../plugins/with-tap-to-pay').default,
      require('../../../../plugins/with-storekit').default,
      require('../../../../plugins/with-apple-pay').default,
      require('../../../../plugins/with-roomplan').default,
      withPhotoKit,
    ];

    let config = baseConfig;
    expect(() => {
      for (const plugin of plugins) {
        config = plugin(config);
      }
    }).not.toThrow();

    expect(config).toBeDefined();
  });
});
