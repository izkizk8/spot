import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ExplainerCardProps {
  style?: ViewStyle;
}

export default function ExplainerCard({ style }: ExplainerCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>About Focus Filters</ThemedText>
      <ThemedText style={styles.body}>
        Focus Filters let you customize app behavior when a Focus mode is active on iOS 16+.
        Configure this filter in Settings → Focus → (pick a focus) → Add Filter → search for "spot"
        → select "Showcase Mode". Choose your preferred mode and accent color parameters.
        {'\n\n'}
        This screen shows both paths: you can simulate filter activation for testing (simulated
        path) or view the real system-activated filter state when a bound focus is active
        (real/actual path).
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
