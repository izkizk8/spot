/**
 * @file TintPicker.tsx
 * @description 4-swatch tint picker with theme-based colors (T013)
 * Per contracts/test-plan.md Story 2.
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { TintToken } from '../types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TintPickerProps {
  tints: readonly TintToken[];
  selectedTint: TintToken;
  onSelect: (tint: TintToken) => void;
}

export function TintPicker({
  tints,
  selectedTint,
  onSelect,
}: TintPickerProps): JSX.Element {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {tints.map((tint) => {
        const isSelected = tint === selectedTint;
        const swatchColor = theme[tint];

        return (
          <Pressable
            key={tint}
            role="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Tint ${tint}`}
            onPress={() => onSelect(tint)}
            style={[
              styles.swatch,
              {
                backgroundColor: swatchColor,
                borderWidth: isSelected ? 3 : 1,
                borderColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
