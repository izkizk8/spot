/**
 * @file ColorPickerDemo.android.tsx
 * @description Android RN fallback for ColorPickerDemo (T025)
 * Swatch grid-based color picker
 */

import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const COLORS = [
  '#FF6B35',
  '#F7931E',
  '#FDC830',
  '#4CAF50',
  '#2196F3',
  '#9C27B0',
  '#E91E63',
  '#607D8B',
] as const;

export function ColorPickerDemo() {
  const [color, setColor] = useState<string>(COLORS[0]);

  return (
    <ThemedView testID="color-picker-demo" style={styles.container}>
      <ThemedText type="smallBold">RN ColorPicker Fallback</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        RN fallback: swatch grid
      </ThemedText>

      <ThemedView style={styles.swatchGrid}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.swatch, { backgroundColor: c }]}
            accessibilityRole="button"
          />
        ))}
      </ThemedView>

      <ThemedView
        testID="color-swatch"
        style={[styles.previewSwatch, { backgroundColor: color }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  caption: {
    marginBottom: Spacing.one,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: Spacing.one,
  },
  previewSwatch: {
    width: 60,
    height: 44,
    borderRadius: Spacing.one,
  },
});
