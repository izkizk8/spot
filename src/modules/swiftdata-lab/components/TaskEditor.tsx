/**
 * TaskEditor Component
 * Feature: 053-swiftdata
 *
 * Compact editor for creating or updating a TaskItem. Title input,
 * priority picker, and a numeric `dueDate` (epoch ms) field — the
 * latter intentionally minimal so the demo stays JS-pure.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Priority, TaskDraft, TaskItem } from '@/native/swiftdata.types';
import { createDraft } from '../task-types';

interface TaskEditorProps {
  initial?: TaskItem | null;
  onSubmit: (draft: TaskDraft) => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

const PRIORITIES: readonly Priority[] = ['low', 'medium', 'high'];
const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
};

export default function TaskEditor({ initial, onSubmit, onCancel, style }: TaskEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium');
  const [dueDateText, setDueDateText] = useState<string>(
    initial?.dueDate != null ? String(initial.dueDate) : '',
  );

  const [prevInitialId, setPrevInitialId] = useState<string | null>(initial?.id ?? null);
  const currentInitialId = initial?.id ?? null;
  if (currentInitialId !== prevInitialId) {
    setPrevInitialId(currentInitialId);
    setTitle(initial?.title ?? '');
    setPriority(initial?.priority ?? 'medium');
    setDueDateText(initial?.dueDate != null ? String(initial.dueDate) : '');
  }

  const handleSubmit = () => {
    const trimmed = dueDateText.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    const dueDate = parsed === null || Number.isNaN(parsed) ? null : parsed;
    onSubmit(createDraft({ title, priority, dueDate, completed: initial?.completed ?? false }));
    if (!initial) {
      setTitle('');
      setPriority('medium');
      setDueDateText('');
    }
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>{initial ? 'Edit Task' : 'New Task'}</ThemedText>
      <TextInput
        accessibilityLabel='Task title'
        placeholder='Title'
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <ThemedView style={styles.row}>
        {PRIORITIES.map((p) => {
          const active = p === priority;
          return (
            <Pressable
              key={p}
              accessibilityRole='button'
              accessibilityLabel={`Priority ${PRIORITY_LABEL[p]}`}
              accessibilityState={{ selected: active }}
              onPress={() => setPriority(p)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                {PRIORITY_LABEL[p]}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
      <TextInput
        accessibilityLabel='Due date (epoch ms)'
        placeholder='Due date (epoch ms, blank for none)'
        value={dueDateText}
        onChangeText={setDueDateText}
        keyboardType='numeric'
        style={styles.input}
      />
      <ThemedView style={styles.actions}>
        <Pressable accessibilityRole='button' onPress={handleSubmit}>
          <ThemedText style={styles.action}>{initial ? 'Save' : 'Create'}</ThemedText>
        </Pressable>
        {onCancel ? (
          <Pressable accessibilityRole='button' onPress={onCancel}>
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
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
