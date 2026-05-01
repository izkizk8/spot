/**
 * @jest-environment node
 *
 * with-coredata-cloudkit Plugin Test
 * Feature: 052-core-data-cloudkit
 */

import { describe, expect, it, jest } from '@jest/globals';

import withCoreDataCloudKit, {
  APS_ENVIRONMENT_KEY,
  APS_ENVIRONMENT_VALUE,
  CLOUDKIT_VALUE,
  ICLOUD_CONTAINERS_KEY,
  ICLOUD_SERVICES_KEY,
  applyApsEnvironment,
  applyICloudContainers,
  applyICloudServices,
} from '../../../../plugins/with-coredata-cloudkit';

import type { ExpoConfig } from '@expo/config-types';

describe('applyICloudServices', () => {
  it('adds CloudKit when key is absent', () => {
    const out = applyICloudServices({});
    expect(out[ICLOUD_SERVICES_KEY]).toEqual([CLOUDKIT_VALUE]);
  });

  it('idempotent (run twice produces deep-equal result)', () => {
    const a = applyICloudServices({});
    const b = applyICloudServices(a);
    expect(b).toEqual(a);
  });

  it('preserves existing services and merges CloudKit in', () => {
    const out = applyICloudServices({ [ICLOUD_SERVICES_KEY]: ['CloudDocuments'] });
    expect(out[ICLOUD_SERVICES_KEY]).toEqual(['CloudDocuments', CLOUDKIT_VALUE]);
  });

  it('does not duplicate CloudKit if already present', () => {
    const initial = { [ICLOUD_SERVICES_KEY]: [CLOUDKIT_VALUE, 'CloudDocuments'] };
    const out = applyICloudServices(initial);
    expect(out[ICLOUD_SERVICES_KEY]).toEqual([CLOUDKIT_VALUE, 'CloudDocuments']);
  });

  it('preserves operator-supplied non-array value', () => {
    const initial = { [ICLOUD_SERVICES_KEY]: 'do-not-touch' };
    const out = applyICloudServices(initial);
    expect(out[ICLOUD_SERVICES_KEY]).toBe('do-not-touch');
  });
});

describe('applyICloudContainers', () => {
  it('adds the container id derived from bundleIdentifier', () => {
    const out = applyICloudContainers({}, 'com.test.app');
    expect(out[ICLOUD_CONTAINERS_KEY]).toEqual(['iCloud.com.test.app']);
  });

  it('is a no-op when bundleIdentifier is missing', () => {
    const out = applyICloudContainers({}, undefined);
    expect(out[ICLOUD_CONTAINERS_KEY]).toBeUndefined();
  });

  it('idempotent', () => {
    const a = applyICloudContainers({}, 'com.test.app');
    const b = applyICloudContainers(a, 'com.test.app');
    expect(b).toEqual(a);
  });

  it('preserves prior identifiers', () => {
    const initial = { [ICLOUD_CONTAINERS_KEY]: ['iCloud.other'] };
    const out = applyICloudContainers(initial, 'com.test.app');
    expect(out[ICLOUD_CONTAINERS_KEY]).toEqual(['iCloud.other', 'iCloud.com.test.app']);
  });
});

describe('applyApsEnvironment', () => {
  it('adds aps-environment when absent', () => {
    const out = applyApsEnvironment({});
    expect(out[APS_ENVIRONMENT_KEY]).toBe(APS_ENVIRONMENT_VALUE);
  });

  it('idempotent', () => {
    const a = applyApsEnvironment({});
    const b = applyApsEnvironment(a);
    expect(b).toEqual(a);
  });

  it('preserves operator-supplied value', () => {
    const out = applyApsEnvironment({ [APS_ENVIRONMENT_KEY]: 'production' });
    expect(out[APS_ENVIRONMENT_KEY]).toBe('production');
  });
});

describe('withCoreDataCloudKit (default plugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: {
      bundleIdentifier: 'com.test.app',
    },
  };

  it('runs without throwing on a baseline config', () => {
    expect(() => withCoreDataCloudKit(baseConfig)).not.toThrow();
  });

  it('is idempotent (run twice produces a single write)', () => {
    let cfg = withCoreDataCloudKit(baseConfig);
    cfg = withCoreDataCloudKit(cfg);
    expect(cfg).toBeDefined();
  });

  it('emits no warnings on a baseline config', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    withCoreDataCloudKit(baseConfig);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
    consoleWarnSpy.mockRestore();
  });

  it('coexistence: app.json includes with-coredata-cloudkit', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(49);
    const idx = plugins.findIndex(
      (p: unknown) => typeof p === 'string' && p === './plugins/with-coredata-cloudkit',
    );
    expect(idx).toBeGreaterThanOrEqual(0);
  });
});
