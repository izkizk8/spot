/**
 * EntitlementBanner — CarPlay Lab (feature 045).
 *
 * Surfaces the Apple-restriction notice and links out to the
 * developer portal request page. Pure presentational component:
 * never throws, never reads the native bridge.
 */

import React, { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export const CARPLAY_PORTAL_URL = 'https://developer.apple.com/contact/carplay/' as const;

export const CARPLAY_CATEGORIES: readonly string[] = [
  'Audio',
  'Communication',
  'Driving Task',
  'EV Charging',
  'Parking',
  'Quick Food Ordering',
];

interface EntitlementBannerProps {
  readonly style?: ViewStyle;
  readonly onOpenPortal?: () => void;
}

export default function EntitlementBanner({ style, onOpenPortal }: EntitlementBannerProps) {
  const handlePress = useCallback(() => {
    if (onOpenPortal) {
      onOpenPortal();
      return;
    }
    void Linking.openURL(CARPLAY_PORTAL_URL).catch(() => {
      // Best-effort: deep-link failures are non-fatal in the lab.
    });
  }, [onOpenPortal]);

  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='carplay-entitlement-banner'
    >
      <ThemedText type='smallBold' themeColor='tintB'>
        ⚠️ CarPlay requires an Apple-issued entitlement
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Apple grants the CarPlay entitlement only for the following six app categories. Without an
        active entitlement, every CarPlay scene call from this app will throw `CarPlayNotEntitled`
        at runtime.
      </ThemedText>
      <ThemedView style={styles.list}>
        {CARPLAY_CATEGORIES.map((c) => (
          <ThemedText
            key={c}
            type='small'
            testID={`carplay-category-${c.toLowerCase().replace(/\s+/g, '-')}`}
          >
            • {c}
          </ThemedText>
        ))}
      </ThemedView>
      <Pressable
        accessibilityRole='link'
        onPress={handlePress}
        testID='carplay-entitlement-portal-link'
      >
        <ThemedText type='link'>Request entitlement on developer.apple.com →</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  list: {
    gap: Spacing.one,
    paddingLeft: Spacing.two,
  },
});
