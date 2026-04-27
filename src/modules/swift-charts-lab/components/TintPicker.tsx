/**
 * T017: TintPicker.tsx — US3 tint swatch picker
 *
 * Four circular swatches with ring + checkmark for selected tint.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Tint } from '../data';

export interface TintPickerProps {
  readonly value: Tint;
  readonly onChange: (next: Tint) => void;
  readonly tints: readonly Tint[];
}

export function TintPicker({ value, onChange, tints }: TintPickerProps) {
  return (
    <ThemedView style={styles.container}>
      {tints.map((tint) => {
        const isSelected = value.id === tint.id;
        // Create dynamic style with StyleSheet to avoid warnings
        const dynamicSwatchStyle = StyleSheet.create({
          color: {
            backgroundColor: tint.value,
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
          },
        });

        return (
          <Pressable
            key={tint.id}
            accessibilityRole="button"
            accessibilityLabel={`Tint: ${tint.id}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(tint)}
            style={styles.swatchButton}
          >
            <View style={[dynamicSwatchStyle.color, isSelected && styles.swatchSelected]}>
              {isSelected && <ThemedText style={styles.checkmark}>✓</ThemedText>}
            </View>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    justifyContent: 'center',
  },
  swatchButton: {
    padding: Spacing.one,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

