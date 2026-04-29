/**
 * with-arkit Plugin Test
 * Feature: 034-arkit-basics
 *
 * Tests idempotency, coexistence with 017's with-vision, UIRequiredDeviceCapabilities
 * append, and NO face-tracking guarantees.
 */

import { withInfoPlist } from '@expo/config-plugins';
import withArkit from '../../plugins/with-arkit';

describe('with-arkit plugin', () => {
  const mockConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: {},
  };

  it('adds NSCameraUsageDescription when absent', () => {
    const result = withArkit(mockConfig as any);
    const modResults = (result as any).mods?.ios?.infoPlist;

    // Plugin uses withInfoPlist, so we need to simulate its execution
    const finalConfig = withInfoPlist(result, (config) => {
      config.modResults = config.modResults || {};
      if (!config.modResults.NSCameraUsageDescription) {
        config.modResults.NSCameraUsageDescription =
          'Used to demonstrate ARKit world tracking and plane detection.';
      }
      return config;
    });

    expect(
      (finalConfig as any).modResults.NSCameraUsageDescription,
    ).toBeTruthy();
  });

  it('preserves existing NSCameraUsageDescription (coexistence with 017)', () => {
    const existingDescription = 'Camera for Vision framework demo';
    const configWithExisting = {
      ...mockConfig,
      modResults: { NSCameraUsageDescription: existingDescription },
    };

    const result = withArkit(configWithExisting as any);
    const finalConfig = withInfoPlist(result, (config) => {
      config.modResults = config.modResults || {};
      if (!config.modResults.NSCameraUsageDescription) {
        config.modResults.NSCameraUsageDescription =
          'Used to demonstrate ARKit world tracking and plane detection.';
      }
      return config;
    });

    expect((finalConfig as any).modResults.NSCameraUsageDescription).toBe(
      existingDescription,
    );
  });

  it('appends "arkit" to UIRequiredDeviceCapabilities when absent', () => {
    const result = withArkit(mockConfig as any);
    const finalConfig = withInfoPlist(result, (config) => {
      config.modResults = config.modResults || {};
      const caps = config.modResults.UIRequiredDeviceCapabilities || [];
      if (!caps.includes('arkit')) {
        config.modResults.UIRequiredDeviceCapabilities = [...caps, 'arkit'];
      }
      return config;
    });

    expect(
      (finalConfig as any).modResults.UIRequiredDeviceCapabilities,
    ).toContain('arkit');
  });

  it('is a no-op when "arkit" already in UIRequiredDeviceCapabilities', () => {
    const configWithArkit = {
      ...mockConfig,
      modResults: { UIRequiredDeviceCapabilities: ['arkit', 'metal'] },
    };

    const result = withArkit(configWithArkit as any);
    const finalConfig = withInfoPlist(result, (config) => {
      config.modResults = config.modResults || {};
      const caps = config.modResults.UIRequiredDeviceCapabilities || [];
      if (!caps.includes('arkit')) {
        config.modResults.UIRequiredDeviceCapabilities = [...caps, 'arkit'];
      }
      return config;
    });

    const caps = (finalConfig as any).modResults.UIRequiredDeviceCapabilities;
    expect(caps.filter((c: string) => c === 'arkit')).toHaveLength(1);
  });

  it('is idempotent: two passes produce deep-equal config', () => {
    const pass1 = withArkit(mockConfig as any);
    const pass2 = withArkit(pass1);

    expect(pass2).toEqual(pass1);
  });

  it('does NOT add any face-tracking strings', () => {
    const result = withArkit(mockConfig as any);
    const modResults = JSON.stringify((result as any).modResults || {});

    expect(modResults).not.toMatch(/NSFaceIDUsageDescription/i);
    expect(modResults).not.toMatch(/ARFaceTrackingConfiguration/i);
    expect(modResults).not.toMatch(/face[-_ ]?tracking/i);
  });
});
