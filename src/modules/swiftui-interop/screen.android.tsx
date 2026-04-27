/**
 * @file screen.android.tsx
 * @description Android SwiftUI Interop screen with banner + RN fallbacks (T029)
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PickerDemo } from './demos/PickerDemo.android';
import { ColorPickerDemo } from './demos/ColorPickerDemo.android';
import { DatePickerDemo } from './demos/DatePickerDemo.android';
import { SliderDemo } from './demos/SliderDemo.android';
import { StepperToggleDemo } from './demos/StepperToggleDemo.android';

export default function SwiftUIInteropScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="swiftui-interop-screen"
    >
      {/* Android banner (FR-012) */}
      <ThemedView type="backgroundElement" style={styles.banner}>
        <ThemedText type="smallBold">
          SwiftUI is iOS-only — here's the Material counterpart
        </ThemedText>
      </ThemedView>

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
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  demoSection: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
