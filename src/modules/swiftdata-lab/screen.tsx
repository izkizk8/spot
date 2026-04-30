/**
 * SwiftData Lab — iOS screen (feature 053).
 *
 * Composes the showcase sections: capability card, tasks list,
 * filters, sort, stats, editor, and setup instructions. The native
 * bridge is exercised through the `useSwiftDataTasks` hook.
 */

import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import FilterPicker from './components/FilterPicker';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupInstructions from './components/SetupInstructions';
import SortPicker from './components/SortPicker';
import StatsCard from './components/StatsCard';
import TaskEditor from './components/TaskEditor';
import TasksList from './components/TasksList';
import { useSwiftDataTasks } from './hooks/useSwiftDataTasks';
import type { TaskDraft, TaskItem } from './task-types';

export default function SwiftDataLabScreen() {
  const store = useSwiftDataTasks();
  const { refreshSchema, refreshTasks } = store;

  const [editing, setEditing] = useState<TaskItem | null>(null);

  useEffect(() => {
    void refreshSchema();
    void refreshTasks();
  }, [refreshSchema, refreshTasks]);

  if (Platform.OS !== 'ios') {
    return (
      <ThemedView style={styles.container}>
        <IOSOnlyBanner />
      </ThemedView>
    );
  }

  const handleSubmit = (draft: TaskDraft) => {
    if (editing) {
      void store.updateTask(editing.id, draft);
      setEditing(null);
    } else {
      void store.createTask(draft);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilityCard style={styles.card} schema={store.schema} />
        <FilterPicker style={styles.card} value={store.filter} onChange={store.setFilter} />
        <SortPicker style={styles.card} value={store.sort} onChange={store.setSort} />
        <TasksList
          style={styles.card}
          tasks={store.visibleTasks}
          loading={store.loading}
          onToggle={(t) => {
            void store.toggleCompleted(t.id);
          }}
          onEdit={setEditing}
          onDelete={(t) => {
            void store.deleteTask(t.id);
          }}
        />
        <TaskEditor
          style={styles.card}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
        <StatsCard style={styles.card} stats={store.stats} />
        <SetupInstructions style={styles.card} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.two,
  },
});
