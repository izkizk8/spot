/**
 * UserActivityCard — feature 031 / T033.
 *
 * Mark/clear current activity CTAs with status pill.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ActivityState = 'active' | 'inactive';

interface UserActivityCardProps {
  readonly state: ActivityState;
  readonly onMark: () => void;
  readonly onClear: () => void;
  readonly style?: ViewStyle;
}

export default function UserActivityCard({ state, onMark, onClear, style }: UserActivityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>User Activity</ThemedText>
      <ThemedView style={styles.statusRow}>
        <ThemedText style={styles.statusLabel}>Status</ThemedText>
        <ThemedView
          style={[styles.pill, state === 'active' ? styles.pillActive : styles.pillInactive]}
        >
          <ThemedText style={styles.pillText}>
            {state === 'active' ? 'Active' : 'Inactive'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedText style={styles.explainer}>
        NSUserActivity marks the current screen as searchable while active. Unlike CSSearchableIndex
        which persists items, activities are ephemeral and tied to the user's current context.
      </ThemedText>
      <ThemedView style={styles.buttons}>
        <Pressable
          accessibilityRole='button'
          onPress={onMark}
          style={[styles.button, styles.markButton]}
        >
          <ThemedText style={styles.buttonText}>Mark this screen as current activity</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole='button'
          onPress={onClear}
          style={[styles.button, styles.clearButton]}
        >
          <ThemedText style={styles.clearButtonText}>Clear current activity</ThemedText>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  statusLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  pillActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  pillInactive: {
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  explainer: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    marginBottom: Spacing.three,
  },
  buttons: {
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  markButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  clearButtonText: {
    fontWeight: '600',
    fontSize: 14,
    opacity: 0.8,
  },
});
