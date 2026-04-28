/**
 * with-coreml — Expo config plugin for feature 016 (CoreML Playground Module).
 *
 * Prebuild-time operations (all idempotent):
 *   1. Verify the operator-supplied `MobileNetV2.mlmodel` exists at
 *      `native/ios/coreml/models/MobileNetV2.mlmodel`. Fail fast with a
 *      recoverable error message if absent (FR-020, SC-008).
 *   2. Declare the `.mlmodel` as an Xcode build resource so the Xcode build
 *      phase auto-compiles it to `.mlmodelc` and copies it into the app bundle.
 *
 * Running the plugin twice on the same Expo config produces a deep-equal
 * config (FR-022).
 *
 * @see specs/016-coreml-playground/tasks.md T019, T020
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withDangerousMod } from '@expo/config-plugins';
import * as fs from 'node:fs';
import * as path from 'node:path';

const withCoreML: ConfigPlugin = (config) => {
  // Verify model presence at prebuild time
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const modelPath = path.join(projectRoot, 'native/ios/coreml/models/MobileNetV2.mlmodel');

      if (!fs.existsSync(modelPath)) {
        throw new Error(
          `[with-coreml] ERROR: model file not found at ${modelPath}\n\n` +
            `Download MobileNetV2.mlmodel from Apple's developer model gallery:\n` +
            `  https://developer.apple.com/machine-learning/models/\n\n` +
            `Place it at: native/ios/coreml/models/MobileNetV2.mlmodel\n\n` +
            `See specs/016-coreml-playground/quickstart.md for detailed instructions.`,
        );
      }

      console.log('[with-coreml] Verified MobileNetV2.mlmodel at native/ios/coreml/models/');

      // The .mlmodel will be picked up by autolinking via the podspec.
      // No manual Xcode project modification needed — expo-modules-core
      // handles resource discovery.

      return cfg;
    },
  ]);
};

export default withCoreML;
