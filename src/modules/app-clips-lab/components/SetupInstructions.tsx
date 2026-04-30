/**
 * SetupInstructions — App Clips Lab (feature 042).
 *
 * Static documentary checklist of the steps required to ship a real
 * App Clip target. Mirrors the structure used elsewhere in the codebase
 * (numbered steps, one per row) and intentionally calls out that a
 * config plugin cannot create the sub-target reliably today.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  readonly style?: ViewStyle;
}

const STEPS: readonly string[] = [
  'Add an App Clip target in Xcode (File → New → Target → App Clip). The bundle id MUST be your parent app id with a `.Clip` suffix (e.g. com.example.app.Clip).',
  'Configure the App Clip entitlement: enable `com.apple.developer.on-demand-install-capable` on the App Clip target and ensure the parent app target keeps Associated Domains.',
  'Author an App Clip Experience configuration in App Store Connect and host the URLs alongside your apple-app-site-association at `/.well-known/apple-app-site-association` with an `appclips` block.',
  'Build and sign the App Clip sub-target. Keep the uncompressed payload under 10MB; avoid frameworks not on the App Clip allowlist (no MapKit JS, no large ML bundles, etc.).',
  'Test the App Clip via TestFlight Internal Testing — Apple ships a "Local Experiences" section in Developer Settings that lets you launch the clip from a URL without scanning a code.',
  'Generate an App Clip Code from App Store Connect (you supply the URL + foreground/background colours) and verify it scans correctly in the iOS Camera and via NFC tag write tools.',
];

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Setup Instructions (Xcode-side)</ThemedText>
      {STEPS.map((step, index) => (
        <View key={index} style={styles.row} testID={`appclip-setup-step-${index}`}>
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
