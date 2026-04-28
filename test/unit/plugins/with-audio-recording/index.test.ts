/**
 * T018: Config plugin test for `with-audio-recording` (feature 020).
 *
 * Coverage:
 *   (a) Adds NSMicrophoneUsageDescription default copy when absent (FR-040)
 *   (b) Preserves operator-set NSMicrophoneUsageDescription (FR-041)
 *   (c) Idempotent: running twice yields deep-equal Info.plist (SC-009)
 *   (d) Coexists with 017 (with-vision) — both NSCameraUsageDescription
 *       and NSMicrophoneUsageDescription survive in either run order
 *   (e) Coexists with 018 (with-speech-recognition) — neither plugin
 *       overwrites the other's NSMicrophoneUsageDescription value
 *   (f) Does NOT add UIBackgroundModes (D-04 / FR-044)
 *   (g) Does NOT touch unrelated Info.plist keys / entitlements / App Groups
 *
 * Mirrors the precedent at test/unit/plugins/with-speech-recognition/index.test.ts.
 */

import type { ExpoConfig } from '@expo/config-types';

const DEFAULT_MIC_COPY = 'Audio Lab uses the microphone to demonstrate recording and playback.';

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

describe('with-audio-recording plugin', () => {
  let withAudioRecording: (config: ExpoConfig) => ExpoConfig;
  let withSpeechRecognition: (config: ExpoConfig) => ExpoConfig;
  let withVision: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    withAudioRecording = require('../../../../plugins/with-audio-recording/index').default;
    withSpeechRecognition = require('../../../../plugins/with-speech-recognition/index').default;
    withVision = require('../../../../plugins/with-vision/index').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withAudioRecording).toBe('function');
  });

  describe('(a/b) NSMicrophoneUsageDescription', () => {
    it('adds default copy when absent', () => {
      const result = withAudioRecording({ name: 'app', slug: 'app', ios: {} });
      expect(result.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(DEFAULT_MIC_COPY);
    });

    it('preserves operator-set value', () => {
      const custom = 'My custom mic copy';
      const result = withAudioRecording({
        name: 'app',
        slug: 'app',
        ios: { infoPlist: { NSMicrophoneUsageDescription: custom } },
      });
      expect(result.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(custom);
    });

    it('handles config with no ios object', () => {
      const result = withAudioRecording({ name: 'app', slug: 'app' });
      expect(result.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(DEFAULT_MIC_COPY);
    });
  });

  describe('(c) Idempotency (SC-009)', () => {
    it('produces deep-equal config when run twice', () => {
      const base: ExpoConfig = { name: 'app', slug: 'app', ios: {} };
      const r1 = withAudioRecording(base);
      const r2 = withAudioRecording(r1);
      expect(r2).toEqual(r1);
    });

    it('is idempotent with an existing operator-set value', () => {
      const base: ExpoConfig = {
        name: 'app',
        slug: 'app',
        ios: { infoPlist: { NSMicrophoneUsageDescription: 'Operator copy' } },
      };
      const r1 = withAudioRecording(base);
      const r2 = withAudioRecording(r1);
      expect(r1.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe('Operator copy');
      expect(r2.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe('Operator copy');
    });
  });

  describe('(d) Coexists with 017 (with-vision)', () => {
    const VISION_COPY_DEFAULT = (() => {
      const r = withVisionForCopy();
      return r.ios?.infoPlist?.NSCameraUsageDescription as string;
    })();

    function withVisionForCopy(): ExpoConfig {
      // re-require fresh to compute the default copy for assertions
      jest.resetModules();
      const fn = require('../../../../plugins/with-vision/index').default as (
        c: ExpoConfig,
      ) => ExpoConfig;
      return fn({ name: 'app', slug: 'app', ios: {} });
    }

    beforeEach(() => {
      jest.resetModules();
      withAudioRecording = require('../../../../plugins/with-audio-recording/index').default;
      withVision = require('../../../../plugins/with-vision/index').default;
    });

    it('vision then audio: both keys present', () => {
      const r1 = withVision({ name: 'app', slug: 'app', ios: {} });
      const r2 = withAudioRecording(r1);
      expect(r2.ios?.infoPlist?.NSCameraUsageDescription).toBe(VISION_COPY_DEFAULT);
      expect(r2.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(DEFAULT_MIC_COPY);
    });

    it('audio then vision: both keys present', () => {
      const r1 = withAudioRecording({ name: 'app', slug: 'app', ios: {} });
      const r2 = withVision(r1);
      expect(r2.ios?.infoPlist?.NSCameraUsageDescription).toBe(VISION_COPY_DEFAULT);
      expect(r2.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(DEFAULT_MIC_COPY);
    });
  });

  describe('(e) Coexists with 018 (with-speech-recognition)', () => {
    it('speech-rec then audio: 018 mic copy is preserved (020 is no-op)', () => {
      const r1 = withSpeechRecognition({ name: 'app', slug: 'app', ios: {} });
      const speechMicCopy = r1.ios?.infoPlist?.NSMicrophoneUsageDescription;
      const r2 = withAudioRecording(r1);
      expect(r2.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(speechMicCopy);
    });

    it('audio then speech-rec: 020 mic copy is preserved (018 is no-op)', () => {
      const r1 = withAudioRecording({ name: 'app', slug: 'app', ios: {} });
      const r2 = withSpeechRecognition(r1);
      expect(r2.ios?.infoPlist?.NSMicrophoneUsageDescription).toBe(DEFAULT_MIC_COPY);
    });
  });

  describe('(f) Does NOT add UIBackgroundModes (D-04 / FR-044)', () => {
    it('absent before → absent after', () => {
      const r = withAudioRecording({ name: 'app', slug: 'app', ios: {} });
      expect(r.ios?.infoPlist?.UIBackgroundModes).toBeUndefined();
    });

    it('preserves an existing operator-set UIBackgroundModes (does not modify)', () => {
      const r = withAudioRecording({
        name: 'app',
        slug: 'app',
        ios: { infoPlist: { UIBackgroundModes: ['fetch'] } },
      });
      expect(r.ios?.infoPlist?.UIBackgroundModes).toEqual(['fetch']);
    });
  });

  describe('(g) Does NOT touch unrelated config', () => {
    it('does not modify NSCameraUsageDescription, NSSpeechRecognitionUsageDescription, entitlements, or App Groups', () => {
      const base: ExpoConfig = {
        name: 'app',
        slug: 'app',
        ios: {
          infoPlist: {
            NSCameraUsageDescription: 'cam',
            NSSpeechRecognitionUsageDescription: 'speech',
          },
          entitlements: {
            'com.apple.developer.family-controls': true,
            'com.apple.security.application-groups': ['group.com.test.widgets'],
          },
        },
      };
      const r = withAudioRecording(base);
      expect(r.ios?.infoPlist?.NSCameraUsageDescription).toBe('cam');
      expect(r.ios?.infoPlist?.NSSpeechRecognitionUsageDescription).toBe('speech');
      expect(r.ios?.entitlements).toEqual(base.ios?.entitlements);
    });

    it('does not add NSCameraUsageDescription when absent', () => {
      const r = withAudioRecording({ name: 'app', slug: 'app', ios: {} });
      expect(r.ios?.infoPlist?.NSCameraUsageDescription).toBeUndefined();
    });
  });
});
