/**
 * @file screen.web.tsx
 * @description Web SwiftUI Interop screen with banner + RN-Web fallbacks (T041)
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PickerDemo } from './demos/PickerDemo.web';
import { ColorPickerDemo } from './demos/ColorPickerDemo.web';
import { DatePickerDemo } from './demos/DatePickerDemo.web';
import { SliderDemo } from './demos/SliderDemo.web';
import { StepperToggleDemo } from './demos/StepperToggleDemo.web';

export default function SwiftUIInteropScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="swiftui-interop-screen"
    >
      {/* Web banner (FR-015) */}
      <ThemedView type="backgroundElement" style={styles.banner}>
        <ThemedText type="smallBold">Native SwiftUI is iOS-only</ThemedText>
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
