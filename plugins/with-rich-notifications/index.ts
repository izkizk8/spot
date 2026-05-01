/**
 * Config plugin for Notifications Lab (feature 026).
 *
 * Sets NSUserNotificationsUsageDescription in Info.plist,
 * registers the expo-notifications plugin block, and declares
 * the Android default notification channel.
 */
import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withAndroidManifest, withInfoPlist, withPlugins } = configPlugins;
const USAGE_KEY = 'NSUserNotificationsUsageDescription';
const USAGE_COPY =
  "Spot uses notifications to demonstrate Apple's User Notifications framework in the Notifications Lab.";

const ANDROID_CHANNEL_ID = 'spot.default';

const withRichNotifications: ConfigPlugin = (config) => {
  // Set NSUserNotificationsUsageDescription in Info.plist
  config = withInfoPlist(config, (mod) => {
    if (mod.modResults[USAGE_KEY] !== USAGE_COPY) {
      mod.modResults[USAGE_KEY] = USAGE_COPY;
    }
    return mod;
  });

  // Register expo-notifications plugin block (idempotent via withPlugins)
  // withPlugins deduplicates by plugin name automatically
  config = withPlugins(config, [
    [
      'expo-notifications',
      {
        // icon and color left at defaults — visuals are not the focus
        mode: 'production',
        androidMode: 'default',
      },
    ],
  ]);

  // Declare Android default notification channel in manifest
  config = withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) return mod;

    app['meta-data'] ??= [];

    const exists = app['meta-data'].some(
      (m) => m.$['android:name'] === 'expo.modules.notifications.default_notification_channel_id',
    );

    if (!exists) {
      app['meta-data'].push({
        $: {
          'android:name': 'expo.modules.notifications.default_notification_channel_id',
          'android:value': ANDROID_CHANNEL_ID,
        },
      });
    }

    return mod;
  });

  return config;
};

export default withRichNotifications;
