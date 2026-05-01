/**
 * @jest-environment node
 */

/**
 * with-icloud-drive Plugin Test
 * Feature: 070-icloud-drive
 */

import { describe, expect, it, jest } from '@jest/globals';
import withICloudDrive, {
  applyICloudDriveEntitlements,
  applyNSUbiquitousContainers,
  ICLOUD_CONTAINERS_KEY,
  UBIQUITY_CONTAINERS_KEY,
  NS_UBIQUITOUS_KEY,
} from '../../../../plugins/with-icloud-drive/index';
import type { ExpoConfig } from '@expo/config-types';

const baseConfig: ExpoConfig = {
  name: 'test-app',
  slug: 'test-app',
  ios: {
    bundleIdentifier: 'com.test.app',
  },
};

describe('applyICloudDriveEntitlements (pure helper)', () => {
  it('inserts icloud-container-identifiers when absent', () => {
    const result = applyICloudDriveEntitlements({}, 'com.test.app');
    expect(result[ICLOUD_CONTAINERS_KEY]).toEqual(['iCloud.com.test.app']);
  });

  it('inserts ubiquity-container-identifiers when absent', () => {
    const result = applyICloudDriveEntitlements({}, 'com.test.app');
    expect(result[UBIQUITY_CONTAINERS_KEY]).toEqual(['iCloud.com.test.app']);
  });

  it('is idempotent (running twice = same result)', () => {
    const result1 = applyICloudDriveEntitlements({}, 'com.test.app');
    const result2 = applyICloudDriveEntitlements(result1, 'com.test.app');
    expect(result2).toEqual(result1);
  });

  it('preserves existing container identifiers', () => {
    const ents = {
      [ICLOUD_CONTAINERS_KEY]: ['iCloud.com.other'],
    };
    const result = applyICloudDriveEntitlements(ents, 'com.test.app');
    expect(result[ICLOUD_CONTAINERS_KEY]).toContain('iCloud.com.other');
    expect(result[ICLOUD_CONTAINERS_KEY]).toContain('iCloud.com.test.app');
  });

  it('preserves other entitlement keys', () => {
    const ents = { 'com.apple.developer.in-app-payments': ['merchant.com.example'] };
    const result = applyICloudDriveEntitlements(ents, 'com.test.app');
    expect(result['com.apple.developer.in-app-payments']).toEqual(['merchant.com.example']);
  });

  it('is a no-op when bundleIdentifier is undefined', () => {
    const ents = { other: 'value' };
    const result = applyICloudDriveEntitlements(ents, undefined);
    expect(result).toEqual(ents);
  });
});

describe('applyNSUbiquitousContainers (pure helper)', () => {
  it('inserts NSUbiquitousContainers when absent', () => {
    const result = applyNSUbiquitousContainers({}, 'com.test.app');
    expect(result[NS_UBIQUITOUS_KEY]).toBeDefined();
    const containers = result[NS_UBIQUITOUS_KEY] as Record<string, unknown>;
    expect(containers['iCloud.com.test.app']).toBeDefined();
  });

  it('is idempotent (running twice = same result)', () => {
    const result1 = applyNSUbiquitousContainers({}, 'com.test.app');
    const result2 = applyNSUbiquitousContainers(result1, 'com.test.app');
    expect(result2).toEqual(result1);
  });

  it('preserves operator-supplied NSUbiquitousContainers value', () => {
    const plist = { [NS_UBIQUITOUS_KEY]: { custom: true } };
    const result = applyNSUbiquitousContainers(plist, 'com.test.app');
    expect(result[NS_UBIQUITOUS_KEY]).toEqual({ custom: true });
  });

  it('preserves other Info.plist keys', () => {
    const plist = { NSCameraUsageDescription: 'Camera' };
    const result = applyNSUbiquitousContainers(plist, 'com.test.app');
    expect(result['NSCameraUsageDescription']).toBe('Camera');
  });

  it('is a no-op when bundleIdentifier is undefined', () => {
    const plist = { other: 'value' };
    const result = applyNSUbiquitousContainers(plist, undefined);
    expect(result).toEqual(plist);
  });
});

describe('withICloudDrive (ConfigPlugin)', () => {
  it('returns a defined config', () => {
    const config = withICloudDrive(baseConfig);
    expect(config).toBeDefined();
  });

  it('is idempotent', () => {
    let config = withICloudDrive(baseConfig);
    config = withICloudDrive(config);
    expect(config).toBeDefined();
  });

  it('emits no warnings on a baseline config', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    withICloudDrive(baseConfig);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
    consoleWarnSpy.mockRestore();
  });

  it('coexistence: app.json has the expected plugin shape', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;

    // After feature 070, plugins.length should be 43
    expect(plugins.length).toBe(48);

    const stringPlugins = plugins.filter((p: unknown) => typeof p === 'string');
    expect(stringPlugins).toContain('./plugins/with-icloud-drive');
  });

  it('mod-chain runs without throwing (5 prior plugins + this one)', () => {
    const plugins = [
      require('../../../../plugins/with-coredata-cloudkit').default,
      require('../../../../plugins/with-tap-to-pay').default,
      require('../../../../plugins/with-storekit').default,
      require('../../../../plugins/with-apple-pay').default,
      require('../../../../plugins/with-roomplan').default,
      withICloudDrive,
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
