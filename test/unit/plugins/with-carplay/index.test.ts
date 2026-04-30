/**
 * Tests for with-carplay Expo config plugin — feature 045.
 *
 * @jest-environment node
 */

import withCarPlay, {
  applyCarPlayEntitlement,
  applyCarPlaySceneManifest,
  CARPLAY_AUDIO_ENTITLEMENT_KEY,
  CARPLAY_CONFIGURATION_NAME,
  CARPLAY_SCENE_CLASS,
  CARPLAY_SCENE_DELEGATE_CLASS,
} from '../../../../plugins/with-carplay';
import { CARPLAY_SCENE_ROLE } from '../../../../src/native/carplay.types';
import type { ExpoConfig } from '@expo/config-types';

describe('with-carplay (entitlement mutation)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Row 1: missing key → set to true, no warn', () => {
    const out = applyCarPlayEntitlement({});
    expect(out[CARPLAY_AUDIO_ENTITLEMENT_KEY]).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 2: developer-supplied boolean is preserved verbatim', () => {
    const out = applyCarPlayEntitlement({
      [CARPLAY_AUDIO_ENTITLEMENT_KEY]: false,
    });
    expect(out[CARPLAY_AUDIO_ENTITLEMENT_KEY]).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 3: non-boolean value is replaced and emits a one-time warn', () => {
    const out = applyCarPlayEntitlement({
      [CARPLAY_AUDIO_ENTITLEMENT_KEY]: 'yes' as unknown,
    });
    expect(out[CARPLAY_AUDIO_ENTITLEMENT_KEY]).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('Row 4: re-running on own output is byte-stable', () => {
    const once = applyCarPlayEntitlement({});
    const twice = applyCarPlayEntitlement(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyCarPlayEntitlement(input);
    expect(out).not.toBe(input);
    expect(input[CARPLAY_AUDIO_ENTITLEMENT_KEY]).toBeUndefined();
  });

  it('coexistence: leaves unrelated entitlements verbatim', () => {
    const input: Record<string, unknown> = {
      'com.apple.developer.on-demand-install-capable': true,
      'com.apple.developer.applesignin': ['Default'],
      'aps-environment': 'production',
    };
    const out = applyCarPlayEntitlement(input);
    expect(out['com.apple.developer.on-demand-install-capable']).toBe(true);
    expect(out['com.apple.developer.applesignin']).toEqual(['Default']);
    expect(out['aps-environment']).toBe('production');
    expect(out[CARPLAY_AUDIO_ENTITLEMENT_KEY]).toBe(true);
  });
});

describe('with-carplay (UISceneManifest mutation)', () => {
  it('seeds an empty Info.plist with the CarPlay scene configuration', () => {
    const out = applyCarPlaySceneManifest({});
    const manifest = out.UIApplicationSceneManifest as Record<string, unknown>;
    expect(manifest).toBeDefined();
    const configs = manifest.UISceneConfigurations as Record<string, unknown>;
    const carplay = configs[CARPLAY_SCENE_ROLE] as Array<Record<string, unknown>>;
    expect(carplay).toHaveLength(1);
    expect(carplay[0]).toEqual({
      UISceneClassName: CARPLAY_SCENE_CLASS,
      UISceneConfigurationName: CARPLAY_CONFIGURATION_NAME,
      UISceneDelegateClassName: CARPLAY_SCENE_DELEGATE_CLASS,
    });
  });

  it('is byte-stable across repeated runs', () => {
    const once = applyCarPlaySceneManifest({});
    const twice = applyCarPlaySceneManifest(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('preserves a pre-existing CarPlay configuration entry', () => {
    const developerEntry = {
      UISceneClassName: CARPLAY_SCENE_CLASS,
      UISceneConfigurationName: 'Custom Configuration',
      UISceneDelegateClassName: CARPLAY_SCENE_DELEGATE_CLASS,
    };
    const input: Record<string, unknown> = {
      UIApplicationSceneManifest: {
        UISceneConfigurations: {
          [CARPLAY_SCENE_ROLE]: [developerEntry],
        },
      },
    };
    const out = applyCarPlaySceneManifest(input);
    const carplay = (
      (out.UIApplicationSceneManifest as Record<string, unknown>).UISceneConfigurations as Record<
        string,
        unknown
      >
    )[CARPLAY_SCENE_ROLE] as Array<Record<string, unknown>>;
    // No duplicate appended; existing entry preserved verbatim.
    expect(carplay).toHaveLength(1);
    expect(carplay[0]).toEqual(developerEntry);
  });

  it('coexists with other UIScene roles (UIWindowSceneSessionRoleApplication)', () => {
    const windowEntry = {
      UISceneClassName: 'UIWindowScene',
      UISceneConfigurationName: 'Default Configuration',
      UISceneDelegateClassName: 'SceneDelegate',
    };
    const input: Record<string, unknown> = {
      UIApplicationSceneManifest: {
        UISceneConfigurations: {
          UIWindowSceneSessionRoleApplication: [windowEntry],
        },
      },
    };
    const out = applyCarPlaySceneManifest(input);
    const configs = (out.UIApplicationSceneManifest as Record<string, unknown>)
      .UISceneConfigurations as Record<string, unknown>;
    expect(configs.UIWindowSceneSessionRoleApplication).toEqual([windowEntry]);
    const carplay = configs[CARPLAY_SCENE_ROLE] as Array<Record<string, unknown>>;
    expect(carplay).toHaveLength(1);
    expect(carplay[0].UISceneDelegateClassName).toBe(CARPLAY_SCENE_DELEGATE_CLASS);
  });

  it('does not mutate the input', () => {
    const input: Record<string, unknown> = {};
    applyCarPlaySceneManifest(input);
    expect(input.UIApplicationSceneManifest).toBeUndefined();
  });
});

describe('with-carplay (plugin wrapper + composition)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('returns a valid ExpoConfig when applied', () => {
    const modded = withCarPlay(baseConfig);
    expect(modded).toBeDefined();
    expect(modded.name).toBe('test-app');
  });

  it('app.json plugins array contains ./plugins/with-carplay exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-carplay',
    ).length;
    expect(count).toBe(1);
  });

  it('coexists with homekit, healthkit, app-clips, mapkit, universal-links without throwing', () => {
    const homekit = require('../../../../plugins/with-homekit').default;
    const healthkit = require('../../../../plugins/with-healthkit').default;
    const appClips = require('../../../../plugins/with-app-clips').default;
    const mapkit = require('../../../../plugins/with-mapkit').default;
    const universalLinks = require('../../../../plugins/with-universal-links').default;

    let config = baseConfig;
    expect(() => {
      config = withCarPlay(config);
      config = homekit(config);
      config = healthkit(config);
      config = appClips(config);
      config = mapkit(config);
      config = universalLinks(config);
      // Re-run to check idempotency under composition.
      config = withCarPlay(config);
      config = homekit(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });
});
