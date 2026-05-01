/**
 * with-quick-actions plugin — unit tests.
 * Feature: 039-quick-actions
 *
 * @see specs/039-quick-actions/contracts/info-plist.md
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

interface ShortcutItem {
  UIApplicationShortcutItemType: string;
  UIApplicationShortcutItemTitle: string;
  UIApplicationShortcutItemSubtitle?: string;
  UIApplicationShortcutItemIconType: 'systemImageName';
  UIApplicationShortcutItemIconFile?: string;
  UIApplicationShortcutItemUserInfo: Record<string, unknown>;
}

const EXPECTED_TYPES = [
  'open-liquid-glass',
  'open-sensors',
  'open-audio-lab',
  'add-mood-happy',
] as const;

describe('with-quick-actions plugin', () => {
  let withQuickActions: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    withQuickActions = require('../../../../plugins/with-quick-actions').default;
  });

  it('default export is a ConfigPlugin function', () => {
    expect(typeof withQuickActions).toBe('function');
  });

  it('produces UIApplicationShortcutItems with the 4 mapped entries in order', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const result = withQuickActions(config);
    const items = result.ios?.infoPlist?.UIApplicationShortcutItems as ShortcutItem[] | undefined;
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(4);
    expect(items?.map((i) => i.UIApplicationShortcutItemType)).toEqual([...EXPECTED_TYPES]);
    items?.forEach((item) => {
      expect(item.UIApplicationShortcutItemTitle.length).toBeGreaterThan(0);
      expect(item.UIApplicationShortcutItemIconType).toBe('systemImageName');
      expect(typeof item.UIApplicationShortcutItemIconFile).toBe('string');
      expect(typeof item.UIApplicationShortcutItemUserInfo).toBe('object');
    });
  });

  it('every entry carries a non-empty subtitle (defaults all set one)', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const result = withQuickActions(config);
    const items = result.ios?.infoPlist?.UIApplicationShortcutItems as ShortcutItem[];
    items.forEach((item) => {
      expect(item.UIApplicationShortcutItemSubtitle).toBeDefined();
      expect((item.UIApplicationShortcutItemSubtitle as string).length).toBeGreaterThan(0);
    });
  });

  it('userInfo carries the route per default', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const result = withQuickActions(config);
    const items = result.ios?.infoPlist?.UIApplicationShortcutItems as ShortcutItem[];
    const sensors = items.find((i) => i.UIApplicationShortcutItemType === 'open-sensors');
    expect(sensors?.UIApplicationShortcutItemUserInfo.route).toBe('/modules/sensors-playground');

    const mood = items.find((i) => i.UIApplicationShortcutItemType === 'add-mood-happy');
    expect(mood?.UIApplicationShortcutItemUserInfo.mood).toBe('happy');
    expect(mood?.UIApplicationShortcutItemUserInfo.route).toBe('/modules/app-intents-lab');
  });

  it('running plugin twice is idempotent (deep-equal)', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const first = withQuickActions(config);
    const second = withQuickActions(first);
    expect(second.ios?.infoPlist?.UIApplicationShortcutItems).toEqual(
      first.ios?.infoPlist?.UIApplicationShortcutItems,
    );
  });

  it('merges with pre-existing UIApplicationShortcutItems instead of overwriting', () => {
    const customItem: ShortcutItem = {
      UIApplicationShortcutItemType: 'custom-pre-existing',
      UIApplicationShortcutItemTitle: 'Pre-existing',
      UIApplicationShortcutItemIconType: 'systemImageName',
      UIApplicationShortcutItemIconFile: 'star',
      UIApplicationShortcutItemUserInfo: { route: '/custom' },
    };
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      ios: {
        infoPlist: {
          UIApplicationShortcutItems: [customItem],
        },
      },
    };
    const result = withQuickActions(config);
    const items = result.ios?.infoPlist?.UIApplicationShortcutItems as ShortcutItem[];
    expect(items).toHaveLength(5);
    expect(items[0].UIApplicationShortcutItemType).toBe('custom-pre-existing');
    expect(items.slice(1).map((i) => i.UIApplicationShortcutItemType)).toEqual([...EXPECTED_TYPES]);
  });

  it('deduplicates by UIApplicationShortcutItemType (no duplicate of an existing default)', () => {
    const conflicting: ShortcutItem = {
      UIApplicationShortcutItemType: 'open-sensors',
      UIApplicationShortcutItemTitle: 'Custom Sensors',
      UIApplicationShortcutItemIconType: 'systemImageName',
      UIApplicationShortcutItemIconFile: 'star',
      UIApplicationShortcutItemUserInfo: { route: '/custom' },
    };
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      ios: {
        infoPlist: {
          UIApplicationShortcutItems: [conflicting],
        },
      },
    };
    const result = withQuickActions(config);
    const items = result.ios?.infoPlist?.UIApplicationShortcutItems as ShortcutItem[];
    const types = items.map((i) => i.UIApplicationShortcutItemType);
    expect(types).toHaveLength(4);
    // pre-existing wins; only non-conflicting defaults appended
    const sensors = items.find((i) => i.UIApplicationShortcutItemType === 'open-sensors');
    expect(sensors?.UIApplicationShortcutItemTitle).toBe('Custom Sensors');
  });

  it('returns the modified ExpoConfig (carries through name/slug)', () => {
    const config: ExpoConfig = { name: 'my-app', slug: 'my-app' };
    const result = withQuickActions(config);
    expect(result.name).toBe('my-app');
    expect(result.slug).toBe('my-app');
  });
});
