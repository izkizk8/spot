/**
 * SetupInstructions Component
 * Feature: 057-photokit
 *
 * Documents the project-side setup required to use PHPickerViewController
 * and the photo-library access permission model.
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
        1. Add `NSPhotoLibraryUsageDescription` to your Info.plist (handled by the `with-photokit`
        config plugin). This string is shown when the system prompts for full photo-library access.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        2. Instantiate `PHPickerConfiguration` and optionally set `selectionLimit` (0 = unlimited)
        and `filter` to restrict media types to images or videos.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        3. Present `PHPickerViewController(configuration:)` from the root view controller. iOS 14+
        does not require a permission prompt for read-only access via PHPicker.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        4. Implement `picker(_:didFinishPicking:)`. Each `PHPickerResult` carries an
        `NSItemProvider`; call `loadFileRepresentation(forTypeIdentifier:)` to get a temporary file
        URL for the asset.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        5. For full library access (e.g., to save or edit assets), call
        `PHPhotoLibrary.requestAuthorization(for: .readWrite)` (iOS 14+) or the legacy
        `.requestAuthorization` (iOS 8+). Handle `.limited` status gracefully — the user may
        restrict access to a subset of their library.
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
