/**
 * @file EffectPicker.tsx
 * @description Segmented control for 7 symbol effects (T011)
 * Per contracts/test-plan.md Story 1.
 */

import * as React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { EffectMetadata } from '../types';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface EffectPickerProps {
  effects: readonly EffectMetadata[];
  selectedId: string;
  onSelect: (effect: EffectMetadata) => void;
}

export function EffectPicker({ effects, selectedId, onSelect }: EffectPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {effects.map((effect) => {
        const isSelected = effect.id === selectedId;
        return (
          <Pressable
            key={effect.id}
            role='button'
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(effect)}
            style={[
              styles.segment,
              {
                backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText
              type='small'
              style={[styles.label, { color: isSelected ? theme.text : theme.textSecondary }]}
            >
              {effect.displayLabel}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  segment: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
});
