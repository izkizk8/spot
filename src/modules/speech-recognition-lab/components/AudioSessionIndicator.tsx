/**
 * AudioSessionIndicator — small dot + label reflecting bridge `isListening`.
 *
 * Updates synchronously with the `active` prop (FR-011). When animation
 * is wired, honours `useReducedMotion()` (NFR-002, NFR-005).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface AudioSessionIndicatorProps {
  active: boolean;
}

export default function AudioSessionIndicator({ active }: AudioSessionIndicatorProps) {
  // Read reduced-motion so future animations can opt-out (NFR-002).
  // Even when no animation is active, calling the hook keeps behavior
  // consistent across renders (it's a no-op when the result is unused).
  const reducedMotion = useReducedMotion();
  void reducedMotion;

  const label = active ? 'Audio session active' : 'Audio session inactive';

  return (
    <ThemedView
      type='background'
      style={styles.row}
      accessibilityRole='text'
      accessibilityLabel={label}
    >
      <View
        style={[styles.dot, active ? styles.dotActive : styles.dotInactive]}
        accessibilityElementsHidden={false}
      />
      <ThemedText type='small' themeColor={active ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  dot: {
    width: Spacing.two,
    height: Spacing.two,
    borderRadius: Spacing.two,
  },
  dotActive: {
    backgroundColor: '#34C759',
  },
  dotInactive: {
    backgroundColor: '#8E8E93',
  },
});
