/**
 * NoteEditor Component
 * Feature: 052-core-data-cloudkit
 *
 * Compact editor for creating or updating a Note.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { createDraft, type Note, type NoteDraft } from '../note-types';

interface NoteEditorProps {
  initial?: Note | null;
  onSubmit: (draft: NoteDraft) => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

export default function NoteEditor({ initial, onSubmit, onCancel, style }: NoteEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');

  const [prevInitialId, setPrevInitialId] = useState<string | null>(initial?.id ?? null);
  const currentInitialId = initial?.id ?? null;
  if (currentInitialId !== prevInitialId) {
    setPrevInitialId(currentInitialId);
    setTitle(initial?.title ?? '');
    setBody(initial?.body ?? '');
  }

  const handleSubmit = () => {
    onSubmit(createDraft({ title, body }));
    setTitle('');
    setBody('');
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>{initial ? 'Edit Note' : 'New Note'}</ThemedText>
      <TextInput
        accessibilityLabel="Note title"
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Note body"
        placeholder="Body"
        value={body}
        onChangeText={setBody}
        multiline
        style={[styles.input, styles.bodyInput]}
      />
      <ThemedView style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={handleSubmit}>
          <ThemedText style={styles.action}>{initial ? 'Save' : 'Create'}</ThemedText>
        </Pressable>
        {onCancel ? (
          <Pressable accessibilityRole="button" onPress={onCancel}>
            <ThemedText style={styles.actionMuted}>Cancel</ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
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
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    padding: Spacing.two,
    fontSize: 14,
  },
  bodyInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionMuted: {
    fontSize: 14,
    opacity: 0.7,
  },
});
