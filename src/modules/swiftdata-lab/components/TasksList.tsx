/**
 * TasksList Component
 * Feature: 053-swiftdata
 *
 * Renders the array of TaskItems (or an empty / loading state).
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { TaskItem } from '@/native/swiftdata.types';
import TaskRow from './TaskRow';

interface TasksListProps {
  tasks: readonly TaskItem[];
  loading?: boolean;
  emptyLabel?: string;
  onToggle?: (task: TaskItem) => void;
  onEdit?: (task: TaskItem) => void;
  onDelete?: (task: TaskItem) => void;
  style?: ViewStyle;
}

export default function TasksList({
  tasks,
  loading,
  emptyLabel,
  onToggle,
  onEdit,
  onDelete,
  style,
}: TasksListProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Tasks</ThemedText>
      {loading ? (
        <ThemedText style={styles.empty}>Loading…</ThemedText>
      ) : tasks.length === 0 ? (
        <ThemedText style={styles.empty}>{emptyLabel ?? 'No tasks. Create one below.'}</ThemedText>
      ) : (
        tasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
        ))
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
