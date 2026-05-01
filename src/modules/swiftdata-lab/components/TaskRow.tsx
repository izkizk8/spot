/**
 * TaskRow Component
 * Feature: 053-swiftdata
 *
 * Renders one TaskItem with toggle / edit / delete affordances.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Priority, TaskItem } from '@/native/swiftdata.types';

interface TaskRowProps {
  task: TaskItem;
  onToggle?: (task: TaskItem) => void;
  onEdit?: (task: TaskItem) => void;
  onDelete?: (task: TaskItem) => void;
  style?: ViewStyle;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low: '#8E8E93',
  medium: '#FF9500',
  high: '#FF3B30',
};

function formatDueDate(dueDate: number | null): string {
  if (dueDate === null) return 'No due date';
  const d = new Date(dueDate);
  return `Due ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TaskRow({ task, onToggle, onEdit, onDelete, style }: TaskRowProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <Pressable
        accessibilityRole='checkbox'
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={task.completed ? 'Mark incomplete' : 'Mark complete'}
        onPress={() => onToggle?.(task)}
        style={styles.toggle}
      >
        <ThemedText style={styles.toggleIcon}>{task.completed ? '☑︎' : '☐'}</ThemedText>
      </Pressable>
      <ThemedView style={styles.body}>
        <ThemedText style={[styles.title, task.completed && styles.titleDone]}>
          {task.title}
        </ThemedText>
        <ThemedView style={styles.meta}>
          <ThemedText style={[styles.priority, { color: PRIORITY_COLOR[task.priority] }]}>
            {PRIORITY_LABEL[task.priority]}
          </ThemedText>
          <ThemedText style={styles.due}>{formatDueDate(task.dueDate)}</ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.actions}>
        <Pressable accessibilityRole='button' onPress={() => onEdit?.(task)}>
          <ThemedText style={styles.action}>Edit</ThemedText>
        </Pressable>
        <Pressable accessibilityRole='button' onPress={() => onDelete?.(task)}>
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
  toggle: {
    paddingRight: Spacing.one,
  },
  toggleIcon: {
    fontSize: 20,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  priority: {
    fontSize: 12,
    fontWeight: '700',
  },
  due: {
    fontSize: 12,
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
