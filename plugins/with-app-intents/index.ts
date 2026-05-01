/**
 * App Intents config plugin for Expo.
 *
 * Adds the four Swift sources under `native/ios/app-intents/` to the
 * main app target's compile sources at `expo prebuild` time.
 *
 * Idempotent. Does NOT add a new target. Does NOT touch Info.plist.
 * Does NOT modify any region the `with-live-activity` plugin writes
 * to (FR-030, SC-011).
 *
 * @see specs/013-app-intents/plan.md § Library decision
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import { withAppIntentsSources } from './add-app-intents-sources.ts';

const withAppIntents: ConfigPlugin = (config) => {
  return withAppIntentsSources(config);
};

export default withAppIntents;
