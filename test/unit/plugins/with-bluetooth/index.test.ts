/**
 * with-bluetooth plugin — unit tests (T045).
 * Feature: 035-core-bluetooth
 */

import type { ExpoConfig } from '@expo/config-types';

const upstreamPluginInvocations: Array<[unknown, unknown]> = [];

jest.mock('@expo/config-plugins', () => {
  const actual = jest.requireActual('@expo/config-plugins');
  return {
    ...actual,
    withPlugins: (config: unknown, plugins: Array<[unknown, unknown]>) => {
      for (const entry of plugins) {
        upstreamPluginInvocations.push(entry);
      }
      return config;
    },
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

describe('with-bluetooth plugin', () => {
  let withBluetooth: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    upstreamPluginInvocations.length = 0;
    withBluetooth = require('../../../../plugins/with-bluetooth/index').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withBluetooth).toBe('function');
  });

  it('chains the upstream react-native-ble-plx plugin exactly once', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    withBluetooth(cfg);
    expect(upstreamPluginInvocations).toHaveLength(1);
    expect(upstreamPluginInvocations[0][0]).toBe('react-native-ble-plx');
    expect(upstreamPluginInvocations[0][1]).toEqual({
      isBackgroundEnabled: false,
      modes: [],
      bluetoothAlwaysPermission: undefined,
    });
  });

  it('sets NSBluetoothAlwaysUsageDescription default when absent', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const result = withBluetooth(cfg);
    expect(result.ios?.infoPlist?.NSBluetoothAlwaysUsageDescription).toBe(
      'Used to demonstrate Core Bluetooth central scanning, connection, and characteristic operations.',
    );
  });

  it('preserves an operator-set NSBluetoothAlwaysUsageDescription (FR-019)', () => {
    const cfg: ExpoConfig = {
      name: 't',
      slug: 't',
      ios: { infoPlist: { NSBluetoothAlwaysUsageDescription: 'OPERATOR' } },
    };
    const result = withBluetooth(cfg);
    expect(result.ios?.infoPlist?.NSBluetoothAlwaysUsageDescription).toBe('OPERATOR');
  });

  it('is idempotent — running twice produces deep-equal output (SC-008)', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const once = withBluetooth(cfg);
    upstreamPluginInvocations.length = 0;
    const twice = withBluetooth(once);
    expect(twice).toEqual(once);
  });
});
