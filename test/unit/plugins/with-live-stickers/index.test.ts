/**
 * with-live-stickers plugin tests (Feature 083 — Live Stickers).
 *
 * Coverage:
 *   - applyPhotoLibraryUsage adds NSPhotoLibraryUsageDescription when absent.
 *   - applyPhotoLibraryUsage preserves an operator-supplied value verbatim.
 *   - applyPhotoLibraryUsage is byte-stable on re-run (idempotent).
 *   - applyPhotoLibraryUsage does not mutate its input.
 *   - app.json plugin chain length bumped to 43.
 *   - The plugin slots in after with-coredata-cloudkit.
 *   - Coexists with the rest of the chain (does not throw).
 *
 * @jest-environment node
 */

import type { ExpoConfig } from '@expo/config-types';

jest.mock('@expo/config-plugins', () => ({
  withInfoPlist: (config: any, callback: (cfg: any) => any) => {
    const modResults: Record<string, unknown> = { ...config.ios?.infoPlist };
    const result = callback({ ...config, modResults, modRequest: {} });
    return {
      ...config,
      ios: {
        ...config.ios,
        infoPlist: result.modResults,
      },
    };
  },
}));

import withLiveStickers, {
  PHOTO_LIBRARY_KEY,
  PHOTO_LIBRARY_USAGE,
  applyPhotoLibraryUsage,
} from '../../../../plugins/with-live-stickers';

describe('applyPhotoLibraryUsage (pure helper)', () => {
  it('adds NSPhotoLibraryUsageDescription when absent', () => {
    const out = applyPhotoLibraryUsage({});
    expect(out[PHOTO_LIBRARY_KEY]).toBe(PHOTO_LIBRARY_USAGE);
  });

  it('preserves an operator-supplied value verbatim', () => {
    const customValue = 'Custom photo library usage string';
    const out = applyPhotoLibraryUsage({ [PHOTO_LIBRARY_KEY]: customValue });
    expect(out[PHOTO_LIBRARY_KEY]).toBe(customValue);
  });

  it('is byte-stable on re-run (idempotent)', () => {
    const once = applyPhotoLibraryUsage({});
    const twice = applyPhotoLibraryUsage(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyPhotoLibraryUsage(input);
    expect(out).not.toBe(input);
    expect(input[PHOTO_LIBRARY_KEY]).toBeUndefined();
  });

  it('preserves unrelated Info.plist keys', () => {
    const out = applyPhotoLibraryUsage({
      NSCameraUsageDescription: 'Camera access',
      NSLocationWhenInUseUsageDescription: 'Location access',
    });
    expect(out['NSCameraUsageDescription']).toBe('Camera access');
    expect(out['NSLocationWhenInUseUsageDescription']).toBe('Location access');
    expect(out[PHOTO_LIBRARY_KEY]).toBe(PHOTO_LIBRARY_USAGE);
  });
});

describe('with-live-stickers (config plugin)', () => {
  it('exports a config plugin function', () => {
    expect(typeof withLiveStickers).toBe('function');
  });

  it('seeds NSPhotoLibraryUsageDescription on a baseline config', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const out = withLiveStickers(cfg);
    expect(out.ios?.infoPlist?.[PHOTO_LIBRARY_KEY]).toBe(PHOTO_LIBRARY_USAGE);
  });

  it('preserves an operator-supplied value', () => {
    const cfg: ExpoConfig = {
      name: 't',
      slug: 't',
      ios: {
        infoPlist: {
          [PHOTO_LIBRARY_KEY]: 'Custom description',
        },
      },
    };
    const out = withLiveStickers(cfg);
    expect(out.ios?.infoPlist?.[PHOTO_LIBRARY_KEY]).toBe('Custom description');
  });

  it('running twice yields a deep-equal config (idempotency)', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const once = withLiveStickers(cfg);
    const twice = withLiveStickers(once);
    expect(twice).toEqual(once);
  });
});

describe('with-live-stickers: app.json registration + chain composition', () => {
  it('app.json plugins array contains ./plugins/with-live-stickers exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-live-stickers',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 43 after feature 083', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(43);
  });

  it('with-live-stickers slots in after with-coredata-cloudkit', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const coredataIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-coredata-cloudkit',
    );
    const liveStickersIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-live-stickers',
    );
    expect(coredataIdx).toBeGreaterThan(-1);
    expect(liveStickersIdx).toBe(coredataIdx + 1);
  });

  it('coexists with with-roomplan and re-runs idempotently', () => {
    const baseConfig: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const withLiveStickers2 = require('../../../../plugins/with-live-stickers').default;
    const withRoomPlan = require('../../../../plugins/with-roomplan').default;

    let config: ExpoConfig = baseConfig;
    expect(() => {
      config = withRoomPlan(config);
      config = withLiveStickers2(config);
      config = withLiveStickers2(config);
      config = withRoomPlan(config);
    }).not.toThrow();
    expect(config.ios?.infoPlist?.[PHOTO_LIBRARY_KEY]).toBe(PHOTO_LIBRARY_USAGE);
  });
});
