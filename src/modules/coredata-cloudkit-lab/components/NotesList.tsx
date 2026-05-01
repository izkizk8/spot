/**
 * NotesList Component
 * Feature: 052-core-data-cloudkit
 *
 * Renders the array of notes (or an empty state).
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Note } from '@/native/coredata-cloudkit.types';
import NoteRow from './NoteRow';

interface NotesListProps {
  notes: readonly Note[];
  loading?: boolean;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  style?: ViewStyle;
}

export default function NotesList({ notes, loading, onEdit, onDelete, style }: NotesListProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Notes</ThemedText>
      {loading ? (
        <ThemedText style={styles.empty}>Loading…</ThemedText>
      ) : notes.length === 0 ? (
        <ThemedText style={styles.empty}>No notes yet. Create one below.</ThemedText>
      ) : (
        notes.map((n) => <NoteRow key={n.id} note={n} onEdit={onEdit} onDelete={onDelete} />)
      )}
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
  empty: {
    fontSize: 14,
    opacity: 0.7,
  },
});
