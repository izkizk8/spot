/**
 * SetupInstructions Component
 * Feature: 060-visual-look-up
 *
 * Documents the project-side setup required to use VisionKit
 * Visual Look Up and the `ImageAnalysisInteraction` overlay.
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
        1. Require iOS 15+ deployment target. The `VNImageAnalyzer` API is only available in
        VisionKit (not the Vision framework) starting from iOS 15.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        2. Add `NSPhotoLibraryUsageDescription` to Info.plist so users can pick photos from the
        library. The `with-visual-look-up` Expo plugin handles this automatically.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        3. Obtain a `CGImage` (from `UIImagePickerController`, `PHPickerViewController`, or a
        bundled asset) and pass it to `VNImageAnalyzer.analyze(image:orientation:analysisTypes:)`.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        4. Attach `ImageAnalysisInteraction` to your `UIImageView` with
        `imageView.addInteraction(interaction)`. Set `interaction.analysis` once the analysis
        completes to enable the long-press popover.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        5. Opt into subject look-up by including `.visualLookUp` in the `analysisTypes`. Add `.text`
        and `.machineReadableCode` for live-text and QR/barcode support.
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
