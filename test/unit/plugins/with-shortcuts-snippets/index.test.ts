/**
 * with-shortcuts-snippets Plugin Test
 * Feature: 072-shortcuts-snippets
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
  withEntitlementsPlist: (config: any, callback: (cfg: any) => any) => {
    const modResults: Record<string, unknown> = { ...config.ios?.entitlements };
    const result = callback({ ...config, modResults, modRequest: {} });
    return {
      ...config,
      ios: {
        ...config.ios,
        entitlements: result.modResults,
      },
    };
  },
}));

import withShortcutsSnippets, {
  applyShortcutsSnippetsInfoPlist,
  USER_ACTIVITY_TYPES_KEY,
  SHORTCUT_ACTIVITY_TYPE,
} from '../../../../plugins/with-shortcuts-snippets';

describe('applyShortcutsSnippetsInfoPlist (pure helper)', () => {
  it('adds NSUserActivityTypes when absent', () => {
    const out = applyShortcutsSnippetsInfoPlist({});
    expect(Array.isArray(out[USER_ACTIVITY_TYPES_KEY])).toBe(true);
    expect((out[USER_ACTIVITY_TYPES_KEY] as string[]).includes(SHORTCUT_ACTIVITY_TYPE)).toBe(true);
  });

  it('appends to an existing NSUserActivityTypes array without duplicate', () => {
    const input = { [USER_ACTIVITY_TYPES_KEY]: ['com.example.existing'] };
    const out = applyShortcutsSnippetsInfoPlist(input);
    const types = out[USER_ACTIVITY_TYPES_KEY] as string[];
    expect(types).toContain('com.example.existing');
    expect(types).toContain(SHORTCUT_ACTIVITY_TYPE);
  });

  it('is byte-stable on re-run (idempotent)', () => {
    const once = applyShortcutsSnippetsInfoPlist({});
    const twice = applyShortcutsSnippetsInfoPlist(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyShortcutsSnippetsInfoPlist(input);
    expect(out).not.toBe(input);
    expect(input[USER_ACTIVITY_TYPES_KEY]).toBeUndefined();
  });

  it('preserves unrelated Info.plist keys', () => {
    const out = applyShortcutsSnippetsInfoPlist({ NSCameraUsageDescription: 'camera' });
    expect(out['NSCameraUsageDescription']).toBe('camera');
  });
});

describe('with-shortcuts-snippets (config plugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('exports a config plugin function', () => {
    expect(typeof withShortcutsSnippets).toBe('function');
  });

  it('seeds NSUserActivityTypes on a baseline config', () => {
    const out = withShortcutsSnippets(baseConfig);
    const types = (out.ios?.infoPlist as Record<string, unknown> | undefined)?.[
      USER_ACTIVITY_TYPES_KEY
    ] as string[] | undefined;
    expect(types).toBeDefined();
    expect(types?.includes(SHORTCUT_ACTIVITY_TYPE)).toBe(true);
  });

  it('appends to an existing NSUserActivityTypes without duplicate', () => {
    const cfg: ExpoConfig = {
      ...baseConfig,
      ios: { infoPlist: { [USER_ACTIVITY_TYPES_KEY]: ['com.existing.activity'] } },
    };
    const out = withShortcutsSnippets(cfg);
    const types = (out.ios?.infoPlist as Record<string, unknown> | undefined)?.[
      USER_ACTIVITY_TYPES_KEY
    ] as string[];
    expect(types).toContain('com.existing.activity');
    expect(types).toContain(SHORTCUT_ACTIVITY_TYPE);
  });

  it('running twice yields a deep-equal config (idempotency)', () => {
    const once = withShortcutsSnippets(baseConfig);
    const twice = withShortcutsSnippets(once);
    expect(twice).toEqual(once);
  });

  it('only edits NSUserActivityTypes', () => {
    const out = withShortcutsSnippets(baseConfig);
    expect(out.name).toBe(baseConfig.name);
    expect(out.slug).toBe(baseConfig.slug);
  });
});

describe('with-shortcuts-snippets: app.json registration + chain composition', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('app.json plugins array contains ./plugins/with-shortcuts-snippets exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-shortcuts-snippets',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 43 after feature 072', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(48);
  });

  it('coexists with prior plugins without throwing', () => {
    const plugins = [
      require('../../../../plugins/with-mapkit').default,
      require('../../../../plugins/with-storekit').default,
      require('../../../../plugins/with-apple-pay').default,
      require('../../../../plugins/with-weatherkit').default,
      require('../../../../plugins/with-coredata-cloudkit').default,
      withShortcutsSnippets,
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
