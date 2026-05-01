import { Stack } from 'expo-router';
import React from 'react';

/**
 * Nested layout for the Modules tab so Expo Router's `Tabs` UI on web treats
 * `/modules/[id]` detail routes as children of the `modules` tab instead of
 * unmatched routes. Without this file, navigating to `/modules/<id>` on web
 * silently falls back to the first tab (FR-026 web parity bug).
 *
 * Native picks the same layout via `expo-router/unstable-native-tabs`, which
 * already handles nested routing implicitly, but the explicit Stack also keeps
 * navigation behavior consistent across platforms.
 */
export default function ModulesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
