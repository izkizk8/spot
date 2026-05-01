/**
 * ConflictDemo Component
 * Feature: 052-core-data-cloudkit
 *
 * Triggers two rapid writes to a Note to demonstrate CloudKit's
 * last-write-wins resolution.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Note } from '@/native/coredata-cloudkit.types';

interface ConflictDemoProps {
  selected: Note | null;
  onTrigger: (id: string) => void;
  style?: ViewStyle;
}

export default function ConflictDemo({ selected, onTrigger, style }: ConflictDemoProps) {
  const disabled = selected === null;
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Conflict Demo</ThemedText>
      <ThemedText style={styles.copy}>
        Two rapid writes to the same record demonstrate CloudKit&apos;s last-write-wins resolution.
        Select a note to enable the trigger.
      </ThemedText>
      <Pressable
        accessibilityRole='button'
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => {
          if (selected) onTrigger(selected.id);
        }}
      >
        <ThemedText style={[styles.action, disabled && styles.actionDisabled]}>
          Simulate Conflict
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  copy: {
    fontSize: 14,
    opacity: 0.8,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionDisabled: {
    opacity: 0.4,
  },
});
