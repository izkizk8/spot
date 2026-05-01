/**
 * @file SliderDemo.web.tsx
 * @description Web RN fallback for SliderDemo (T039)
 * Same segmented chips as Android
 */

import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEPS = [0, 25, 50, 75, 100] as const;

export function SliderDemo() {
  const [value, setValue] = useState<number>(50);
  const theme = useTheme();

  return (
    <ThemedView testID='slider-demo' style={styles.container}>
      <ThemedText type='smallBold'>Web Slider Fallback</ThemedText>
      <ThemedText type='small' themeColor='textSecondary' style={styles.caption}>
        RN-Web fallback: segmented chip row
      </ThemedText>

      <ThemedView style={styles.chipRow}>
        {STEPS.map((step) => (
          <Pressable
            key={step}
            onPress={() => setValue(step)}
            role='button'
            style={[
              styles.chip,
              {
                backgroundColor:
                  value === step ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText type='small'>{step}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <ThemedView type='backgroundElement' style={styles.barContainer}>
        <ThemedView
          testID='slider-bar'
          style={[
            styles.bar,
            {
              width: `${value}%`,
              backgroundColor: theme.tintA,
            },
          ]}
        />
        <ThemedText type='small' style={styles.barLabel}>
          {value}%
        </ThemedText>
      </ThemedView>
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
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    minWidth: 40,
    alignItems: 'center',
  },
  barContainer: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bar: {
    height: 8,
    borderRadius: Spacing.half,
  },
  barLabel: {
    minWidth: 40,
  },
});
