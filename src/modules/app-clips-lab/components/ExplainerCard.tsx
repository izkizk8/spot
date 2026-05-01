/**
 * ExplainerCard — App Clips Lab (feature 042).
 *
 * Static educational card describing what App Clips are, how they're
 * invoked, and the App Clip Code surface.
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
      <ThemedText style={styles.heading}>About App Clips</ThemedText>
      <ThemedText style={styles.body}>
        An App Clip is a small (&lt;10MB) slice of your iOS 14+ app that runs without a full
        install. The user taps an App Clip Code, NFC tag, Smart App Banner, Maps place card, or
        shared link in Messages and is dropped straight into a focused task — paying for parking,
        ordering food, renting a scooter — without visiting the App Store.
      </ThemedText>
      <ThemedText style={styles.body}>
        Invocation surfaces include: App Clip Codes (the visual ring), NFC tags (NDEF URI records
        scanned from the lock-screen), QR codes via the Camera app, Smart App Banners and App Clip
        meta-tags in Safari, place cards in Apple Maps, and previews of shared links in Messages. On
        launch the App Clip target receives a `_XCAppClipURL` user-activity URL describing the
        invocation.
      </ThemedText>
      <ThemedText style={styles.note}>
        App Clips are a separate Xcode target with their own bundle id (`{'<'}parent-id{'>'}.Clip`),
        an App Clip entitlement, an App Clip Experience configuration hosted alongside the parent
        app's AASA file, and a strict 10MB uncompressed size budget. This module is a scaffold — the
        real target must still be added in Xcode.
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
