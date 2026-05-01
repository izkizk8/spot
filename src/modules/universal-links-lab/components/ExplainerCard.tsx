/**
 * ExplainerCard — Universal Links Lab (feature 041).
 *
 * Plain-text explainer of how iOS Universal Links work and the
 * runtime caveats that make a UL silently fail.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ExplainerCardProps {
  readonly style?: ViewStyle;
}

export default function ExplainerCard({ style }: ExplainerCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>About Universal Links</ThemedText>
      <ThemedText style={styles.body}>
        A Universal Link is a real https URL that, when tapped on iOS 9+, opens your app to a
        specific screen instead of Safari — provided the app is installed and the device has
        validated your apple-app-site-association (AASA) file.
      </ThemedText>
      <ThemedText style={styles.body}>
        Setup requires three things: (1) the `applinks:your-domain` Associated Domains entitlement,
        (2) an AASA JSON file hosted at `https://your-domain/.well-known/apple-app-site-association`
        served as `application/json` with no redirects, and (3) a route handler in the app —
        expo-router automatically maps incoming URLs to file-based routes.
      </ThemedText>
      <ThemedText style={styles.note}>
        Caveats: AASA is fetched once on first launch and cached (re-fetched on app updates). The
        device must be signed into iCloud to use the swift CDN path; offline first-launch falls back
        to a direct fetch. A long-press on the link in iOS reveals an "Open in Safari" escape hatch
        — users who pick that bypass the app entirely.
      </ThemedText>
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
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
