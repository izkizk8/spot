/**
 * with-eventkit — Expo config plugin.
 * Feature: 037-eventkit
 *
 * Adds four EventKit Info.plist usage-description keys:
 * - NSCalendarsUsageDescription
 * - NSCalendarsWriteOnlyAccessUsageDescription (iOS 17+)
 * - NSRemindersUsageDescription
 * - NSRemindersFullAccessUsageDescription (iOS 17+)
 *
 * Each key is set ONLY when absent or empty, preserving any
 * operator-supplied value (P3). Running the plugin twice on
 * the same Expo config produces a deep-equal config (P5).
 *
 * To customise: set `ios.infoPlist["NSCalendarsUsageDescription"]`
 * (etc.) in app.json directly. The plugin will not overwrite them.
 *
 * iOS 17+ surfaces the more granular "write-only" / "full-access"
 * prompts when the corresponding pair of keys is present; iOS < 17
 * ignores the iOS-17-only keys harmlessly.
 *
 * @see specs/037-eventkit/contracts/with-eventkit-plugin.md
 * @see specs/037-eventkit/quickstart.md §2
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const KEYS = {
  NSCalendarsUsageDescription:
    'This module demonstrates EventKit calendar access for educational purposes.',
  NSCalendarsWriteOnlyAccessUsageDescription:
    'This module may demonstrate write-only calendar event creation on iOS 17+.',
  NSRemindersUsageDescription:
    'This module demonstrates EventKit reminders access for educational purposes.',
  NSRemindersFullAccessUsageDescription:
    'This module demonstrates full reminders access on iOS 17+ for educational purposes.',
} as const;

const withEventKit: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    for (const key of Object.keys(KEYS) as Array<keyof typeof KEYS>) {
      const existing = cfg.modResults[key];
      if (typeof existing !== 'string' || existing.trim() === '') {
        cfg.modResults[key] = KEYS[key];
      }
    }
    return cfg;
  });

export default withEventKit;
