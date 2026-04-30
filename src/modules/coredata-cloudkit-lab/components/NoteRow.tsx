/**
 * NoteRow Component
 * Feature: 052-core-data-cloudkit
 *
 * Renders one Note with edit/delete affordances.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Note } from '@/native/coredata-cloudkit.types';

interface NoteRowProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  style?: ViewStyle;
}

export default function NoteRow({ note, onEdit, onDelete, style }: NoteRowProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedView style={styles.body}>
        <ThemedText style={styles.title}>{note.title}</ThemedText>
        <ThemedText style={styles.preview} numberOfLines={2}>
          {note.body}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => onEdit?.(note)}>
          <ThemedText style={styles.action}>Edit</ThemedText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onDelete?.(note)}>
          <ThemedText style={styles.actionDanger}>Delete</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  preview: {
    fontSize: 13,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
