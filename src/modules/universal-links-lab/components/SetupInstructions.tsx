/**
 * SetupInstructions — Universal Links Lab (feature 041).
 *
 * Static documentary card listing the steps required to wire Universal
 * Links into a real domain.
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
  'Pick a domain you control and add `applinks:<domain>` to expo.ios.associatedDomains in app.json.',
  'Build the Apple Developer Team ID for your account (Apple Developer → Membership).',
  'Generate an AASA JSON document (see the AASA Preview card above) with your bundle id and team id.',
  'Host the JSON at https://<your-domain>/.well-known/apple-app-site-association with Content-Type: application/json and NO redirects.',
  'Confirm reachability with curl -I; status must be 200 and the body MUST be JSON, not HTML.',
  'Re-run a development build (the entitlement is a build-time setting; OTA cannot add it).',
  'On the device: long-press a https://<your-domain>/path link in Notes or Messages; "Open in <app>" should appear at the top.',
  'Tap the link; the app should launch and the URL should appear in the Invocations log below.',
];

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Setup Instructions</ThemedText>
      {STEPS.map((step, index) => (
        <View key={index} style={styles.row} testID={`setup-step-${index}`}>
          <ThemedText type='smallBold' style={styles.num}>
            {index + 1}.
          </ThemedText>
          <ThemedText type='small' style={styles.body}>
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
