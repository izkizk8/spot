/**
 * @file screen.tsx
 * @description SwiftUI Interop screen - iOS default (T012)
 * Composes 5 SwiftUI demo blocks in canonical order.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PickerDemo } from './demos/PickerDemo';
import { ColorPickerDemo } from './demos/ColorPickerDemo';
import { DatePickerDemo } from './demos/DatePickerDemo';
import { SliderDemo } from './demos/SliderDemo';
import { StepperToggleDemo } from './demos/StepperToggleDemo';

export default function SwiftUIInteropScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID='swiftui-interop-screen'
    >
      <ThemedView style={styles.demoSection}>
        <PickerDemo />
      </ThemedView>

      <ThemedView style={styles.demoSection}>
        <ColorPickerDemo />
      </ThemedView>

      <ThemedView style={styles.demoSection}>
        <DatePickerDemo />
      </ThemedView>

      <ThemedView style={styles.demoSection}>
        <SliderDemo />
      </ThemedView>

      <ThemedView style={styles.demoSection}>
        <StepperToggleDemo />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  demoSection: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
