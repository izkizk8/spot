/**
 * CustomActivityToggle — feature 033 / T029.
 *
 * Toggle for includeCustomActivity. Disabled with caption on non-iOS.
 */

import React from 'react';
import { Platform, StyleSheet, Switch, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface CustomActivityToggleProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly style?: ViewStyle;
}

export default function CustomActivityToggle({
  value,
  onValueChange,
  style,
}: CustomActivityToggleProps) {
  const isIOS = Platform.OS === 'ios';
  const disabled = !isIOS;

  return (
    <ThemedView style={[styles.container, style]} accessibilityState={{ disabled }}>
      <ThemedView style={styles.row}>
        <ThemedText style={styles.label}>Include custom activity (Copy with prefix)</ThemedText>
        <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
      </ThemedView>

      {disabled && (
        <ThemedText style={styles.caption}>
          iOS only — custom UIActivity subclass not supported on other platforms.
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  caption: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.three,
  },
});
