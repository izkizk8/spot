/**
 * @file SymbolPicker.tsx
 * @description Horizontal scrollable symbol picker (T010)
 * Per contracts/test-plan.md Story 1.
 */

import React from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import type { CuratedSymbol } from '../types';
import { AnimatedSymbol } from './AnimatedSymbol';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SymbolPickerProps {
  symbols: readonly CuratedSymbol[];
  selectedName: string;
  onSelect: (symbol: CuratedSymbol) => void;
  tintColor: string;
}

export function SymbolPicker({
  symbols,
  selectedName,
  onSelect,
  tintColor,
}: SymbolPickerProps): JSX.Element {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {symbols.map((symbol) => {
        const isSelected = symbol.name === selectedName;
        return (
          <Pressable
            key={symbol.name}
            role="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(symbol)}
            style={[
              styles.cell,
              {
                backgroundColor: isSelected
                  ? theme.backgroundSelected
                  : theme.backgroundElement,
              },
            ]}
          >
            <AnimatedSymbol
              name={symbol.name}
              effect="bounce"
              speed="normal"
              repeat="once"
              tintColor={tintColor}
              size={32}
              playToken={0}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  cell: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
