/**
 * @file SampleRatePicker.tsx
 * @description 3-segment sample-rate picker (30 / 60 / 120 Hz).
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type SampleRate = 30 | 60 | 120;

const RATES: readonly SampleRate[] = [30, 60, 120];

export interface SampleRatePickerProps {
  value: SampleRate;
  onChange: (rate: SampleRate) => void;
}

export function SampleRatePicker({ value, onChange }: SampleRatePickerProps) {
  return (
    <ThemedView style={styles.row} testID="sample-rate-picker">
      {RATES.map((rate) => {
        const selected = rate === value;
        return (
          <Pressable
            key={rate}
            testID={`sample-rate-${rate}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(rate)}
            style={[styles.segment, selected ? styles.segmentSelected : null]}
          >
            <ThemedText type={selected ? 'smallBold' : 'small'}>{`${rate} Hz`}</ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Spacing.two,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    borderRadius: Spacing.one,
  },
  segmentSelected: {
    backgroundColor: '#E0E1E6',
  },
});
