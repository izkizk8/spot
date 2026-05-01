/**
 * AttributionFooter — WeatherKit Lab (feature 046).
 *
 * Apple **requires** that every WeatherKit-powered surface carry
 * the "Weather data provided by Apple Weather" attribution and
 * link to the legal page. This component renders that attribution
 * in a tap-to-open-link layout. Pure presentational.
 */

import React, { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export const APPLE_WEATHER_LEGAL_URL =
  'https://weatherkit.apple.com/legal-attribution.html' as const;

export const APPLE_WEATHER_ATTRIBUTION_LABEL = 'Apple Weather' as const;

interface AttributionFooterProps {
  readonly style?: ViewStyle;
  readonly legalPageUrl?: string;
  readonly onOpen?: () => void;
}

export default function AttributionFooter({
  style,
  legalPageUrl = APPLE_WEATHER_LEGAL_URL,
  onOpen,
}: AttributionFooterProps) {
  const handlePress = useCallback(() => {
    if (onOpen) {
      onOpen();
      return;
    }
    void Linking.openURL(legalPageUrl).catch(() => {
      // Best-effort: deep-link failures are non-fatal in the lab.
    });
  }, [legalPageUrl, onOpen]);

  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='weatherkit-attribution-footer'
    >
      <ThemedText type='small' themeColor='textSecondary'>
        Weather data provided by {APPLE_WEATHER_ATTRIBUTION_LABEL}.
      </ThemedText>
      <Pressable
        accessibilityRole='link'
        onPress={handlePress}
        testID='weatherkit-attribution-link'
      >
        <ThemedText type='link'>Legal attribution →</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Spacing.two,
  },
});
