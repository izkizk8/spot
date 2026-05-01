/**
 * FileList Component
 * Feature: 070-icloud-drive
 *
 * Renders the list of ICloudFileItem entries returned by NSMetadataQuery.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ICloudFileItem } from '@/native/icloud-drive.types';

interface FileListProps {
  files: readonly ICloudFileItem[];
  loading: boolean;
  style?: ViewStyle;
}

export default function FileList({ files, loading, style }: FileListProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>iCloud Files</ThemedText>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading files" />
      ) : files.length === 0 ? (
        <ThemedText style={styles.empty}>No files in the ubiquity container.</ThemedText>
      ) : (
        files.map((item) => (
          <ThemedView key={item.url} style={styles.row}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.meta}>
              {(item.size / 1024).toFixed(1)} KB · {new Date(item.modifiedAt).toLocaleDateString()}
            </ThemedText>
          </ThemedView>
        ))
      )}
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
    marginBottom: Spacing.one,
  },
  empty: {
    fontSize: 14,
    opacity: 0.7,
  },
  row: {
    paddingVertical: Spacing.one,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
  },
  meta: {
    fontSize: 12,
    opacity: 0.65,
  },
});
