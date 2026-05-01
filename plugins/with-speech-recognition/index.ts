/**
 * with-speech-recognition — Expo config plugin for feature 018.
 *
 * Prebuild-time operations (all idempotent):
 *   1. Add NSSpeechRecognitionUsageDescription to Info.plist if absent.
 *   2. Add NSMicrophoneUsageDescription to Info.plist if absent.
 *
 * Existing values are preserved untouched (FR-027). Coexists with
 * sibling plugins (007 / 014 / 015 / 016 / 017) by editing only the two
 * Info.plist keys this feature owns.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const DEFAULT_SPEECH_USAGE = 'Used to demonstrate live speech-to-text recognition';
const DEFAULT_MIC_USAGE = 'Used to capture audio for live speech-to-text';

const withSpeechRecognition: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    if (!cfg.modResults.NSSpeechRecognitionUsageDescription) {
      cfg.modResults.NSSpeechRecognitionUsageDescription = DEFAULT_SPEECH_USAGE;
    }
    if (!cfg.modResults.NSMicrophoneUsageDescription) {
      cfg.modResults.NSMicrophoneUsageDescription = DEFAULT_MIC_USAGE;
    }
    return cfg;
  });

export default withSpeechRecognition;
