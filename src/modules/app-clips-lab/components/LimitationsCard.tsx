/**
 * LimitationsCard — App Clips Lab (feature 042).
 *
 * Static documentary card listing the App Clip platform limitations a
 * developer must keep in mind when sizing and shipping a clip.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface LimitationsCardProps {
  readonly style?: ViewStyle;
}

const LIMITS: readonly { readonly title: string; readonly body: string }[] = [
  {
    title: 'Size budget — 10MB uncompressed',
    body: 'Apple enforces a hard 10MB uncompressed size cap on the App Clip payload. Going over rejects the build at submission. Aggressive asset stripping and an asset-catalog-only image pipeline are typical.',
  },
  {
    title: 'Restricted frameworks',
    body: 'No HealthKit, no in-app purchase outside ASKAppClip APIs, no background modes (no audio, location, fetch), no CallKit, no CloudKit private database, no advertising attribution outside SKAdNetwork.',
  },
  {
    title: 'No persistent on-device state',
    body: 'Data written by the clip lives in a shared App Group container, but Apple may evict App Clip data at any time. Treat the clip as ephemeral; do not assume next-launch persistence.',
  },
  {
    title: 'Limited launch lifetime',
    body: 'The App Clip is purged automatically after a period of disuse (≈8h–10d depending on iOS version). The full app must be installed for long-term workflows.',
  },
  {
    title: 'Authentication',
    body: 'Use Sign in with Apple (one-tap), ASWebAuthenticationSession with App Clip-specific privacy rules, or App Clip-specific Apple Pay flows. Email/password forms are explicitly discouraged.',
  },
  {
    title: 'Maps & Smart App Banners require an Experience',
    body: 'Maps place cards and Smart App Banners only show the App Clip option if an App Clip Experience matching the URL is configured in App Store Connect.',
  },
];

export default function LimitationsCard({ style }: LimitationsCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Limitations</ThemedText>
      {LIMITS.map((item, index) => (
        <View key={index} style={styles.row} testID={`appclip-limit-${index}`}>
          <ThemedText type='smallBold'>{item.title}</ThemedText>
          <ThemedText type='small' themeColor='textSecondary' style={styles.body}>
            {item.body}
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
    paddingVertical: Spacing.one,
    gap: Spacing.half,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  body: {
    lineHeight: 18,
  },
});
