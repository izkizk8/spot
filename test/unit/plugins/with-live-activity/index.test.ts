/**
 * Tests for the with-live-activity config plugin.
 *
 * Covers:
 * - Info.plist mutation (NSSupportsLiveActivities = true)
 * - Plugin idempotency (running twice produces same result)
 *
 * Note: Full Xcode project manipulation testing is limited in Jest.
 * The plugin's target registration is validated via `expo prebuild --clean`
 * in T046.
 *
 * @see specs/007-live-activities-dynamic-island/tasks.md T021
 */

import { withLiveActivityInfoPlist } from '../../../../plugins/with-live-activity/set-info-plist';

interface MockConfig {
  name: string;
  slug: string;
  _mockInfoPlist: Record<string, unknown>;
}

// Mock the @expo/config-plugins module
jest.mock('@expo/config-plugins', () => ({
  withInfoPlist: jest.fn((config: MockConfig, callback: (cfg: unknown) => unknown) => {
    // Simulate withInfoPlist behavior
    const modResults = config._mockInfoPlist || {};
    const result = callback({
      ...config,
      modResults,
      modRequest: { projectRoot: '/mock/project' },
    }) as MockConfig & { modResults: Record<string, unknown> };
    return {
      ...result,
      _mockInfoPlist: result.modResults,
    };
  }),
  withXcodeProject: jest.fn((config: MockConfig) => {
    // Return config unchanged for these tests
    return config;
  }),
  IOSConfig: {
    BundleIdentifier: {
      getBundleIdentifier: jest.fn(() => 'com.test.app'),
    },
  },
  ConfigPlugin: {},
}));

describe('with-live-activity config plugin', () => {
  describe('withLiveActivityInfoPlist', () => {
    it('sets NSSupportsLiveActivities to true', () => {
      const config: MockConfig = {
        name: 'test-app',
        slug: 'test-app',
        _mockInfoPlist: {},
      };

      const result = withLiveActivityInfoPlist(config as never) as MockConfig;

      expect(result._mockInfoPlist.NSSupportsLiveActivities).toBe(true);
    });

    it('is idempotent - running twice produces same result', () => {
      const config: MockConfig = {
        name: 'test-app',
        slug: 'test-app',
        _mockInfoPlist: {},
      };

      const firstResult = withLiveActivityInfoPlist(config as never) as MockConfig;
      const secondResult = withLiveActivityInfoPlist(firstResult as never) as MockConfig;

      expect(secondResult._mockInfoPlist.NSSupportsLiveActivities).toBe(true);
      expect(firstResult._mockInfoPlist).toEqual(secondResult._mockInfoPlist);
    });

    it('does not change existing true value', () => {
      const config: MockConfig = {
        name: 'test-app',
        slug: 'test-app',
        _mockInfoPlist: {
          NSSupportsLiveActivities: true,
          SomeOtherKey: 'value',
        },
      };

      const result = withLiveActivityInfoPlist(config as never) as MockConfig;

      expect(result._mockInfoPlist.NSSupportsLiveActivities).toBe(true);
      expect(result._mockInfoPlist.SomeOtherKey).toBe('value');
    });

    it('overwrites false value to true', () => {
      const config: MockConfig = {
        name: 'test-app',
        slug: 'test-app',
        _mockInfoPlist: {
          NSSupportsLiveActivities: false,
        },
      };

      const result = withLiveActivityInfoPlist(config as never) as MockConfig;

      expect(result._mockInfoPlist.NSSupportsLiveActivities).toBe(true);
    });
  });

  describe('composed plugin', () => {
    it('exports a valid config plugin', () => {
      // Use require to test the composed plugin
      const withLiveActivity = require('../../../../plugins/with-live-activity/index').default;

      expect(typeof withLiveActivity).toBe('function');
    });

    it('composed plugin sets NSSupportsLiveActivities', () => {
      const withLiveActivity = require('../../../../plugins/with-live-activity/index').default;

      const config: MockConfig = {
        name: 'test-app',
        slug: 'test-app',
        _mockInfoPlist: {},
      };

      const result = withLiveActivity(config as never) as MockConfig;

      expect(result._mockInfoPlist.NSSupportsLiveActivities).toBe(true);
    });
  });
});
