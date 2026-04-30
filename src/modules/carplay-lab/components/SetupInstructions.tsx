/**
 * SetupInstructions — CarPlay Lab (feature 045).
 *
 * Static checklist of the steps required to ship a real CarPlay
 * scene. Mirrors the documentary tone of the App Clips lab: numbered
 * rows, single source of truth in `STEPS`.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  readonly style?: ViewStyle;
}

export const CARPLAY_SETUP_STEPS: readonly string[] = [
  'Request the CarPlay entitlement on developer.apple.com (Audio / Communication / Driving Task / EV / Parking / Quick Food). Apple review is required and takes weeks.',
  'Once granted, enable the entitlement in Xcode → Signing & Capabilities → CarPlay (com.apple.developer.carplay-audio for the Audio category, etc.). The `with-carplay` plugin sets the placeholder boolean for you.',
  'Author the UISceneManifest entry in Info.plist: under `UIApplicationSceneManifest.UISceneConfigurations` add a `CPTemplateApplicationSceneSessionRoleApplication` array with one configuration matching the SceneConfigForm card above.',
  'Implement `CarPlaySceneDelegate` (templated in `native/ios/carplay/CarPlaySceneDelegate.swift`). Its `templateApplicationScene(_:didConnect:)` callback owns the root template; subsequent navigation is via `pushTemplate` / `presentTemplate`.',
  'Test in Xcode → I/O → External Displays → CarPlay (1024x768). Real CarPlay hardware testing requires a physical Apple-licensed CarPlay head unit.',
  'Submit to App Review with a short video demonstrating the in-car use case. Apple frequently rejects CarPlay submissions where the category does not match the actual app behaviour.',
];

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView style={[styles.container, style]} testID="carplay-setup-instructions">
      <ThemedText style={styles.heading}>Setup Instructions (Xcode + portal)</ThemedText>
      {CARPLAY_SETUP_STEPS.map((step, index) => (
        <View key={index} style={styles.row} testID={`carplay-setup-step-${index}`}>
          <ThemedText type="smallBold" style={styles.num}>
            {index + 1}.
          </ThemedText>
          <ThemedText type="small" style={styles.body}>
            {step}
          </ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  num: {
    minWidth: 20,
  },
  body: {
    flex: 1,
    lineHeight: 20,
  },
});
