/**
 * @file DatePickerDemo.android.tsx
 * @description Android RN fallback for DatePickerDemo (T026)
 * Simple +/- day buttons
 */

import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DatePickerDemo() {
  const [date, setDate] = useState<Date>(new Date());

  const adjustDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  return (
    <ThemedView testID="date-picker-demo" style={styles.container}>
      <ThemedText type="smallBold">RN DatePicker Fallback</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        RN fallback: +/- day buttons
      </ThemedText>

      <ThemedView style={styles.controls}>
        <Pressable
          onPress={() => adjustDate(-1)}
          accessibilityRole="button"
        >
          <ThemedView type="backgroundSelected" style={styles.button}>
            <ThemedText type="small">−1 day</ThemedText>
          </ThemedView>
        </Pressable>

        <ThemedView type="backgroundElement" style={styles.echo}>
          <ThemedText type="small">{formatDate(date)}</ThemedText>
        </ThemedView>

        <Pressable
          onPress={() => adjustDate(1)}
          accessibilityRole="button"
        >
          <ThemedView type="backgroundSelected" style={styles.button}>
            <ThemedText type="small">+1 day</ThemedText>
          </ThemedView>
        </Pressable>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: '#2196F3',
    borderRadius: Spacing.one,
  },
  echo: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
});
