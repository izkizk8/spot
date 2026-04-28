/**
 * T010: Config plugin test for with-vision.
 *
 * Coverage:
 *   - Adds NSCameraUsageDescription with default copy when the key is absent (FR-026)
 *   - Preserves existing NSCameraUsageDescription value when present (does not overwrite; FR-026)
 *   - Idempotent: running the plugin twice produces deep-equal output (FR-028)
 *   - Coexists with feature 007's LiveActivityWidget, feature 014's HomeWidget,
 *     feature 015's DeviceActivityMonitorExtension, feature 016's CoreML config (FR-029)
 *   - Does not modify entitlements, App Groups, or extension targets from 007/014/015/016
 */

import type { ExpoConfig } from '@expo/config-types';

// Mock @expo/config-plugins so withInfoPlist runs its callback synchronously
// and writes the resulting modResults back onto config.ios.infoPlist.
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

describe('with-vision plugin', () => {
  let withVision: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    withVision = require('../../../../plugins/with-vision/index').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withVision).toBe('function');
  });

  describe('NSCameraUsageDescription', () => {
    it('adds NSCameraUsageDescription with default copy when absent', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };

      const result = withVision(baseConfig);

      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );
    });

    it('preserves existing NSCameraUsageDescription when present', () => {
      const existingMessage = 'Custom camera permission message';
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          infoPlist: {
            NSCameraUsageDescription: existingMessage,
          },
        },
      };

      const result = withVision(baseConfig);

      // Should NOT overwrite the existing value
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(existingMessage);
    });

    it('handles config without ios object', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
      };

      const result = withVision(baseConfig);

      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );
    });

    it('handles config with ios object but no infoPlist', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          bundleIdentifier: 'com.test.app',
        },
      };

      const result = withVision(baseConfig);

      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );
    });
  });

  describe('Idempotency', () => {
    it('produces deep-equal config when run twice (FR-028)', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };

      const result1 = withVision(baseConfig);
      const result2 = withVision(result1);

      // Deep equality check
      expect(result2).toEqual(result1);
      expect(result2.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        result1.ios?.infoPlist?.NSCameraUsageDescription,
      );
    });

    it('is idempotent with existing NSCameraUsageDescription', () => {
      const existingMessage = 'Already set camera permission';
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          infoPlist: {
            NSCameraUsageDescription: existingMessage,
          },
        },
      };

      const result1 = withVision(baseConfig);
      const result2 = withVision(result1);
      const result3 = withVision(result2);

      expect(result1.ios?.infoPlist?.NSCameraUsageDescription).toBe(existingMessage);
      expect(result2.ios?.infoPlist?.NSCameraUsageDescription).toBe(existingMessage);
      expect(result3.ios?.infoPlist?.NSCameraUsageDescription).toBe(existingMessage);
    });
  });

  describe('Coexistence with other plugins (FR-029)', () => {
    it('coexists with feature 007 LiveActivityWidget target', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          infoPlist: {
            // Simulate feature 007's config
            UIBackgroundModes: ['fetch', 'remote-notification'],
          },
          entitlements: {
            'com.apple.developer.usernotifications.filtering': true,
          },
        },
        plugins: ['./plugins/with-live-activity'],
      };

      const result = withVision(baseConfig);

      // Should add NSCameraUsageDescription
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );

      // Should preserve feature 007's config
      expect(result.ios?.infoPlist?.UIBackgroundModes).toEqual(['fetch', 'remote-notification']);
      expect(result.ios?.entitlements?.['com.apple.developer.usernotifications.filtering']).toBe(
        true,
      );
      expect(result.plugins).toContain('./plugins/with-live-activity');
    });

    it('coexists with feature 014 HomeWidget target', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          entitlements: {
            'com.apple.security.application-groups': ['group.com.test.widgets'],
          },
        },
        plugins: ['./plugins/with-home-widgets'],
      };

      const result = withVision(baseConfig);

      // Should add NSCameraUsageDescription
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );

      // Should preserve feature 014's App Groups
      expect(result.ios?.entitlements?.['com.apple.security.application-groups']).toEqual([
        'group.com.test.widgets',
      ]);
    });

    it('coexists with feature 015 DeviceActivityMonitorExtension target', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          entitlements: {
            'com.apple.developer.family-controls': true,
          },
        },
        plugins: ['./plugins/with-screentime'],
      };

      const result = withVision(baseConfig);

      // Should add NSCameraUsageDescription
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );

      // Should preserve feature 015's entitlements
      expect(result.ios?.entitlements?.['com.apple.developer.family-controls']).toBe(true);
    });

    it('coexists with feature 016 CoreML config', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
        plugins: ['./plugins/with-coreml'],
      };

      const result = withVision(baseConfig);

      // Should add NSCameraUsageDescription
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );

      // Should preserve feature 016 plugin
      expect(result.plugins).toContain('./plugins/with-coreml');
    });

    it('does not modify existing entitlements from other features', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          entitlements: {
            'com.apple.developer.family-controls': true,
            'com.apple.security.application-groups': ['group.com.test.widgets'],
            'com.apple.developer.usernotifications.filtering': true,
          },
        },
      };

      const result = withVision(baseConfig);

      // Should add NSCameraUsageDescription
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );

      // Should preserve ALL existing entitlements unchanged
      expect(result.ios?.entitlements?.['com.apple.developer.family-controls']).toBe(true);
      expect(result.ios?.entitlements?.['com.apple.security.application-groups']).toEqual([
        'group.com.test.widgets',
      ]);
      expect(result.ios?.entitlements?.['com.apple.developer.usernotifications.filtering']).toBe(
        true,
      );
    });

    it('does not add or modify App Groups', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };

      const result = withVision(baseConfig);

      // Should NOT create App Groups (that's feature 014/015's territory)
      expect(result.ios?.entitlements?.['com.apple.security.application-groups']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('does not throw for minimal config', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
      };

      expect(() => withVision(baseConfig)).not.toThrow();
    });

    it('does not throw for config with other plugins', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        plugins: [
          './plugins/with-live-activity',
          './plugins/with-home-widgets',
          './plugins/with-screentime',
          './plugins/with-coreml',
        ],
      };

      expect(() => withVision(baseConfig)).not.toThrow();
    });
  });
});
