/**
 * T010: Config plugin test for with-speech-recognition.
 *
 * Coverage:
 *   - Adds NSSpeechRecognitionUsageDescription with default copy when absent (FR-026)
 *   - Adds NSMicrophoneUsageDescription with default copy when absent (FR-026)
 *   - Preserves existing NSSpeechRecognitionUsageDescription when present
 *   - Preserves existing NSMicrophoneUsageDescription when present
 *   - Idempotent: running plugin twice yields deep-equal output (FR-027, SC-008)
 *   - Coexists with feature 007 (LiveActivityWidget), 014 (HomeWidget),
 *     015 (DeviceActivityMonitorExtension), 016 (CoreML), 017 (Vision)
 *     plugins/configs without collision (FR-028, SC-009)
 *   - Does not modify entitlements, App Groups, or NSCameraUsageDescription
 */

import type { ExpoConfig } from '@expo/config-types';

const DEFAULT_SPEECH_COPY = 'Used to demonstrate live speech-to-text recognition';
const DEFAULT_MIC_COPY = 'Used to capture audio for live speech-to-text';

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

describe('with-speech-recognition plugin', () => {
  let withSpeechRecognition: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    withSpeechRecognition = require('../../../../plugins/with-speech-recognition/index').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withSpeechRecognition).toBe('function');
  });

  describe('NSSpeechRecognitionUsageDescription', () => {
    it('adds NSSpeechRecognitionUsageDescription with default copy when absent', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
    });

    it('preserves existing NSSpeechRecognitionUsageDescription value', () => {
      const customCopy = 'Custom speech permission text';
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { infoPlist: { NSSpeechRecognitionUsageDescription: customCopy } },
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(customCopy);
    });

    it('handles config without ios object', () => {
      const baseConfig: ExpoConfig = { name: 'test-app', slug: 'test-app' };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
    });
  });

  describe('NSMicrophoneUsageDescription', () => {
    it('adds NSMicrophoneUsageDescription with default copy when absent', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(DEFAULT_MIC_COPY);
    });

    it('preserves existing NSMicrophoneUsageDescription value', () => {
      const customCopy = 'Custom microphone permission text';
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { infoPlist: { NSMicrophoneUsageDescription: customCopy } },
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(customCopy);
    });

    it('preserves both keys independently when one is present and the other is absent', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { infoPlist: { NSMicrophoneUsageDescription: 'Already-set mic copy' } },
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe('Already-set mic copy');
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
    });
  });

  describe('Idempotency (FR-027)', () => {
    it('produces deep-equal config when run twice', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };
      const result1 = withSpeechRecognition(baseConfig);
      const result2 = withSpeechRecognition(result1);
      expect(result2).toEqual(result1);
    });

    it('is idempotent with existing values', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          infoPlist: {
            NSSpeechRecognitionUsageDescription: 'Custom A',
            NSMicrophoneUsageDescription: 'Custom B',
          },
        },
      };
      const r1 = withSpeechRecognition(baseConfig);
      const r2 = withSpeechRecognition(r1);
      const r3 = withSpeechRecognition(r2);
      expect(r1.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe('Custom A');
      expect(r3.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe('Custom A');
      expect(r3.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe('Custom B');
    });
  });

  describe('Coexistence with other plugins (FR-028, SC-009)', () => {
    it('coexists with feature 007 (LiveActivity) — preserves UIBackgroundModes & entitlements', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          infoPlist: { UIBackgroundModes: ['fetch', 'remote-notification'] },
          entitlements: { 'com.apple.developer.usernotifications.filtering': true },
        },
        plugins: ['./plugins/with-live-activity'],
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
      expect(result.ios?.infoPlist?.UIBackgroundModes).toEqual(['fetch', 'remote-notification']);
      expect(result.ios?.entitlements?.['com.apple.developer.usernotifications.filtering']).toBe(
        true,
      );
      expect(result.plugins).toContain('./plugins/with-live-activity');
    });

    it('coexists with feature 014 (HomeWidget) — preserves App Groups', () => {
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
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
      expect(result.ios?.entitlements?.['com.apple.security.application-groups']).toEqual([
        'group.com.test.widgets',
      ]);
    });

    it('coexists with feature 015 (ScreenTime) — preserves family-controls entitlement', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { entitlements: { 'com.apple.developer.family-controls': true } },
        plugins: ['./plugins/with-screentime'],
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
      expect(result.ios?.entitlements?.['com.apple.developer.family-controls']).toBe(true);
    });

    it('coexists with feature 016 (CoreML) plugin', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
        plugins: ['./plugins/with-coreml'],
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
      expect(result.plugins).toContain('./plugins/with-coreml');
    });

    it('coexists with feature 017 (Vision) — preserves NSCameraUsageDescription', () => {
      const visionCopy = 'Used to demonstrate on-device Vision analysis';
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { infoPlist: { NSCameraUsageDescription: visionCopy } },
        plugins: ['./plugins/with-vision'],
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe(DEFAULT_SPEECH_COPY);
      expect(result.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(DEFAULT_MIC_COPY);
      // MUST NOT modify the camera key.
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(visionCopy);
      expect(result.plugins).toContain('./plugins/with-vision');
    });
  });

  describe('Does not modify unrelated config', () => {
    it('does not modify entitlements', () => {
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
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.entitlements).toEqual(baseConfig.ios?.entitlements);
    });

    it('does not add App Groups', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.entitlements?.['com.apple.security.application-groups']).toBeUndefined();
    });

    it('does not modify NSCameraUsageDescription when absent (does not add it)', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };
      const result = withSpeechRecognition(baseConfig);
      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('does not throw for minimal config', () => {
      const baseConfig: ExpoConfig = { name: 'test-app', slug: 'test-app' };
      expect(() => withSpeechRecognition(baseConfig)).not.toThrow();
    });

    it('does not throw when stacked with all sibling plugins', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        plugins: [
          './plugins/with-live-activity',
          './plugins/with-home-widgets',
          './plugins/with-screentime',
          './plugins/with-coreml',
          './plugins/with-vision',
        ],
      };
      expect(() => withSpeechRecognition(baseConfig)).not.toThrow();
    });
  });
});
