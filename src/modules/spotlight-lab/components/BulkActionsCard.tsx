/**
 * BulkActionsCard — feature 031 / T031.
 *
 * Renders "Index all" and "Remove all from index" CTAs.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface BulkActionsCardProps {
  readonly pending: boolean;
  readonly onIndexAll: () => void;
  readonly onRemoveAll: () => void;
  readonly style?: ViewStyle;
}

export default function BulkActionsCard({
  pending,
  onIndexAll,
  onRemoveAll,
  style,
}: BulkActionsCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Bulk Actions</ThemedText>
      {pending && (
        <ThemedView style={styles.loadingRow}>
          <ActivityIndicator testID="activity-indicator" size="small" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Working...</ThemedText>
        </ThemedView>
      )}
      <ThemedView style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          onPress={onIndexAll}
          disabled={pending}
          style={[styles.button, styles.indexButton, pending && styles.buttonDisabled]}
        >
          <ThemedText style={styles.buttonText}>Index All</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          onPress={onRemoveAll}
          disabled={pending}
          style={[styles.button, styles.removeButton, pending && styles.buttonDisabled]}
        >
          <ThemedText style={styles.removeButtonText}>Remove All from Index</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.8,
    marginLeft: Spacing.two,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  indexButton: {
    backgroundColor: '#007AFF',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
});
