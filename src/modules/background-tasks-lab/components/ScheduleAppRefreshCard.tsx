/**
 * ScheduleAppRefreshCard — feature 030 / T027.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { TaskRunRecord } from '@/native/background-tasks.types';

import type { ScheduleStatus } from '@/modules/background-tasks-lab/hooks/useBackgroundTasks';

interface ScheduleAppRefreshCardProps {
  readonly status: ScheduleStatus | TaskRunRecord['status'];
  readonly lastRun: TaskRunRecord | null;
  readonly onSchedule: () => void;
  readonly style?: ViewStyle;
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'Idle',
  scheduled: 'Scheduled',
  running: 'Running',
  completed: 'Completed',
  expired: 'Expired',
  canceled: 'Canceled',
};

function formatTimestamp(ms: number | null): string {
  if (ms == null) return '—';
  return new Date(ms).toLocaleString();
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  return `${ms} ms`;
}

export default function ScheduleAppRefreshCard({
  status,
  lastRun,
  onSchedule,
  style,
}: ScheduleAppRefreshCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>App Refresh</ThemedText>
      <Pressable accessibilityRole='button' onPress={onSchedule} style={styles.button}>
        <ThemedText style={styles.buttonText}>Schedule App Refresh</ThemedText>
      </Pressable>
      <ThemedView style={styles.statusRow}>
        <ThemedText style={styles.statusLabel}>Status</ThemedText>
        <ThemedText style={styles.statusValue}>{STATUS_LABEL[status] ?? status}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.row}>
        <ThemedText style={styles.label}>Last run</ThemedText>
        <ThemedText style={styles.value}>{formatTimestamp(lastRun?.endedAt ?? null)}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.row}>
        <ThemedText style={styles.label}>Duration</ThemedText>
        <ThemedText style={styles.value}>{formatDuration(lastRun?.durationMs ?? null)}</ThemedText>
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
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  statusLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
  },
  value: {
    fontSize: 12,
  },
});
