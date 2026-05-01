/**
 * @jest-environment node
 */

/**
 * with-visual-look-up Plugin Test
 * Feature: 060-visual-look-up
 */

import { describe, expect, it, jest } from '@jest/globals';
import withVisualLookUp, {
  applyPhotoLibraryUsage,
  PHOTO_LIBRARY_USAGE_KEY,
  DEFAULT_PHOTO_LIBRARY_DESCRIPTION,
} from '../../../../plugins/with-visual-look-up/index';
import type { ExpoConfig } from '@expo/config-types';

const baseConfig: ExpoConfig = {
  name: 'test-app',
  slug: 'test-app',
  ios: {
    bundleIdentifier: 'com.test.app',
  },
};

describe('applyPhotoLibraryUsage (pure helper)', () => {
  it('inserts NSPhotoLibraryUsageDescription when absent', () => {
    const result = applyPhotoLibraryUsage({});
    expect(result[PHOTO_LIBRARY_USAGE_KEY]).toBe(DEFAULT_PHOTO_LIBRARY_DESCRIPTION);
  });

  it('is idempotent (running twice = same result)', () => {
    const result1 = applyPhotoLibraryUsage({});
    const result2 = applyPhotoLibraryUsage(result1);
    expect(result2).toEqual(result1);
  });

  it('preserves an existing operator-supplied value', () => {
    const plist = { [PHOTO_LIBRARY_USAGE_KEY]: 'Custom copy' };
    const result = applyPhotoLibraryUsage(plist);
    expect(result[PHOTO_LIBRARY_USAGE_KEY]).toBe('Custom copy');
  });

  it('preserves other Info.plist keys untouched', () => {
    const plist = { NSCameraUsageDescription: 'Camera', other: 42 };
    const result = applyPhotoLibraryUsage(plist);
    expect(result['NSCameraUsageDescription']).toBe('Camera');
    expect(result['other']).toBe(42);
  });
});

describe('withVisualLookUp (ConfigPlugin)', () => {
  it('returns a defined config', () => {
    const config = withVisualLookUp(baseConfig);
    expect(config).toBeDefined();
  });

  it('is idempotent', () => {
    let config = withVisualLookUp(baseConfig);
    config = withVisualLookUp(config);
    expect(config).toBeDefined();
  });

  it('emits no warnings on a baseline config', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    withVisualLookUp(baseConfig);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
    consoleWarnSpy.mockRestore();
  });

  it('coexistence: app.json has the expected plugin shape', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;

    // After feature 060, plugins.length should be 43
    expect(plugins.length).toBe(44);

    const stringPlugins = plugins.filter((p: unknown) => typeof p === 'string');
    expect(stringPlugins).toContain('./plugins/with-visual-look-up');
  });

  it('mod-chain runs without throwing (5 prior plugins + this one)', () => {
    const plugins = [
      require('../../../../plugins/with-coredata-cloudkit').default,
      require('../../../../plugins/with-tap-to-pay').default,
      require('../../../../plugins/with-storekit').default,
      require('../../../../plugins/with-apple-pay').default,
      require('../../../../plugins/with-roomplan').default,
      withVisualLookUp,
    ];

    let config: ExpoConfig = baseConfig;
    expect(() => {
      for (const plugin of plugins) {
        config = plugin(config);
      }
    }).not.toThrow();

    expect(config).toBeDefined();
  });
});
