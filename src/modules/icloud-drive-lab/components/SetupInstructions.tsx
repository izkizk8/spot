/**
 * SetupInstructions Component
 * Feature: 070-icloud-drive
 *
 * Documents the project-side setup required to use iCloud Drive
 * via NSFileCoordinator and NSMetadataQuery.
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
        1. Enroll in the Apple Developer Program (paid membership required) at
        developer.apple.com/programs.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        2. In Xcode, select your target → Signing &amp; Capabilities → + Capability → iCloud. Enable
        &quot;iCloud Documents&quot; and register a container (e.g. iCloud.com.your.bundle).
      </ThemedText>
      <ThemedText style={styles.bullet}>
        3. The `with-icloud-drive` Expo plugin writes
        `com.apple.developer.icloud-container-identifiers`,
        `com.apple.developer.ubiquity-container-identifiers`, and `NSUbiquitousContainers` to the
        generated native project automatically on `expo prebuild`.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        4. Use `NSFileCoordinator` with a `NSFilePresenter` to safely read and write files. Never
        access iCloud files without a coordinator — concurrent writes will corrupt data.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        5. Start `NSMetadataQuery` with scope `NSMetadataQueryUbiquitousDocumentsScope` and
        subscribe to `NSMetadataQueryDidUpdateNotification` to receive live file-list updates across
        devices.
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
