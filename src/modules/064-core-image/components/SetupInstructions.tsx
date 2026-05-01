/**
 * SetupInstructions Component
 * Feature: 064-core-image
 *
 * Documents the minimal setup required to use CIFilter on iOS and
 * notes that no special entitlements are needed.
 */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  style?: ViewStyle;
}

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Setup Instructions</ThemedText>
      <ThemedText style={styles.bullet}>
        1. Import the CoreImage framework. No additional entitlements or Info.plist keys are
        required — CIFilter is available on every iOS device since iOS 5.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        2. Create a `CIImage` from a `UIImage`, `CGImage`, file URL, or raw pixel data. For GPU
        acceleration pass a `CIContext` backed by a Metal device.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        3. Instantiate the filter with `CIFilter(name: "CISepiaTone")` and set its `inputImage` and
        parameter keys via `setValue(_:forKey:)`.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        4. Retrieve the output with `filter.outputImage`, then render to a `CGImage` via
        `CIContext.createCGImage(_:from:)`. Wrap in `UIImage` for display.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        5. Chain filters by feeding one filter's `outputImage` into the next filter's `inputImage` —
        Core Image defers rendering until the terminal `createCGImage` call, so long chains have
        minimal overhead.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bullet: {
    fontSize: 13,
    opacity: 0.85,
  },
});
