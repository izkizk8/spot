/**
 * SetupInstructions Component
 * Feature: 052-core-data-cloudkit
 *
 * Documents the project-side configuration required to enable
 * NSPersistentCloudKitContainer sync end-to-end.
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
        1. Configure an iCloud container in the Apple Developer portal and reference it as
        `iCloud.&lt;bundleId&gt;`.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        2. Enable the iCloud and Push Notifications capabilities in Xcode (the
        with-coredata-cloudkit plugin adds the matching entitlement keys).
      </ThemedText>
      <ThemedText style={styles.bullet}>
        3. Initialize `NSPersistentCloudKitContainer` with the container identifier and load the
        persistent store.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        4. Subscribe to `NSPersistentStoreRemoteChange` to react to remote sync events.
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
