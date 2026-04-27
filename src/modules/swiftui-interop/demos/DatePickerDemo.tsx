/**
 * @file DatePickerDemo.tsx
 * @description iOS SwiftUI DatePicker demo (T015)
 * Shows real SwiftUI DatePicker (compact + wheel) with RN echo
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Host, DatePicker, RNHostView } from '@expo/ui/swift-ui';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Formats a Date to human-readable string (locale-aware).
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DatePickerDemo() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <ThemedView testID="date-picker-demo" style={styles.container}>
      <ThemedText type="smallBold">SwiftUI DatePicker</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        Real SwiftUI DatePicker (compact & wheel styles)
      </ThemedText>

      <View style={styles.demoRow}>
        {/* Compact style */}
        <Host matchContents>
          <DatePicker
            selection={date}
            onDateChange={(value: Date) => setDate(value)}
            title="Pick date"
            displayedComponents={['date']}
          />
        </Host>

        <RNHostView matchContents>
          <ThemedView type="backgroundElement" style={styles.echo}>
            <ThemedText type="small">{formatDate(date)}</ThemedText>
          </ThemedView>
        </RNHostView>
      </View>
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
  demoRow: {
    gap: Spacing.two,
  },
  swiftUIContainer: {
    minHeight: 44,
  },
  echoContainer: {
    minHeight: 44,
  },
  echo: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
});
