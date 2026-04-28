/**
 * with-audio-recording — Expo config plugin for feature 020.
 *
 * Prebuild-time operations (idempotent):
 *   - Add NSMicrophoneUsageDescription to Info.plist when absent (FR-040).
 *
 * Coexists with sibling plugins (007 / 014 / 015 / 016 / 017 / 018) by
 * editing only the single Info.plist key this feature owns. In particular,
 * if 018 (with-speech-recognition) has already populated
 * NSMicrophoneUsageDescription, this plugin is a no-op on the key (FR-041).
 *
 * Does NOT add UIBackgroundModes (D-04 / FR-044) — recording is foreground-only.
 * Does NOT touch NSCameraUsageDescription, NSSpeechRecognitionUsageDescription,
 * entitlements, or App Groups.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const DEFAULT_MIC_USAGE =
  'Audio Lab uses the microphone to demonstrate recording and playback.';

const withAudioRecording: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    if (!cfg.modResults.NSMicrophoneUsageDescription) {
      cfg.modResults.NSMicrophoneUsageDescription = DEFAULT_MIC_USAGE;
    }
    return cfg;
  });

export default withAudioRecording;
