/**
 * with-controls Plugin Test
 * Feature: 087-controls
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

import withControls, {
  applyControlsInfoPlist,
  CONTROLS_KEY,
  CONTROLS_VALUE,
} from '../../../../plugins/with-controls';

describe('applyControlsInfoPlist (pure helper)', () => {
  it('adds NSSupportsControlCenter when absent', () => {
    const out = applyControlsInfoPlist({});
    expect(out[CONTROLS_KEY]).toBe(CONTROLS_VALUE);
  });

  it('overwrites an existing NSSupportsControlCenter', () => {
    const out = applyControlsInfoPlist({ [CONTROLS_KEY]: false });
    expect(out[CONTROLS_KEY]).toBe(CONTROLS_VALUE);
  });

  it('is idempotent (running twice produces a deep-equal result)', () => {
    const once = applyControlsInfoPlist({});
    const twice = applyControlsInfoPlist(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyControlsInfoPlist(input);
    expect(out).not.toBe(input);
    expect(input[CONTROLS_KEY]).toBeUndefined();
  });

  it('preserves unrelated Info.plist keys', () => {
    const out = applyControlsInfoPlist({ NSLocationWhenInUseUsageDescription: 'location' });
    expect(out['NSLocationWhenInUseUsageDescription']).toBe('location');
  });
});

describe('with-controls (config plugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('exports a config plugin function', () => {
    expect(typeof withControls).toBe('function');
  });

  it('applies NSSupportsControlCenter = true to infoPlist', () => {
    const result = withControls(baseConfig);
    expect((result as any).ios.infoPlist[CONTROLS_KEY]).toBe(true);
  });

  it('is idempotent when run twice', () => {
    const once = withControls(baseConfig);
    const twice = withControls(once as ExpoConfig);
    expect((twice as any).ios.infoPlist[CONTROLS_KEY]).toBe(true);
  });

  it('preserves existing infoPlist keys', () => {
    const configWithPlist: ExpoConfig = {
      ...baseConfig,
      ios: { ...baseConfig.ios, infoPlist: { NSCameraUsageDescription: 'camera' } },
    };
    const result = withControls(configWithPlist);
    expect((result as any).ios.infoPlist['NSCameraUsageDescription']).toBe('camera');
  });

  it('coexistence: app.json has the expected plugin count', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(43); // bumped from 42 by feature 087 (with-controls)

    const hasControls = plugins.some(
      (p: unknown) => typeof p === 'string' && p === './plugins/with-controls',
    );
    expect(hasControls).toBe(true);
  });
});
