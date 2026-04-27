/**
 * MonitoringCard — Start / Stop daily monitor + Active/Inactive pill +
 * default schedule "09:00–21:00 daily" (FR-008).
 *
 * The schedule is hard-coded per data-model.md §1.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/screentime';
import type { MonitoringSchedule, SelectionSummary } from '@/native/screentime.types';

export const DEFAULT_SCHEDULE: MonitoringSchedule = {
  startHour: 9,
  startMinute: 0,
  endHour: 21,
  endMinute: 0,
};

export const DEFAULT_SCHEDULE_LABEL = '09:00–21:00 daily';

export interface MonitoringCardProps {
  readonly monitoringActive: boolean;
  readonly selectionSummary: SelectionSummary | null;
  readonly onStarted: (schedule: MonitoringSchedule) => void;
  readonly onStopped: () => void;
  readonly onError: (message: string) => void;
  readonly disabled?: boolean;
}

export function MonitoringCard({
  monitoringActive,
  selectionSummary,
  onStarted,
  onStopped,
  onError,
  disabled = false,
}: MonitoringCardProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleStart = async (): Promise<void> => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const token = selectionSummary?.rawSelectionToken ?? '';
      await bridge.startMonitoring(token, DEFAULT_SCHEDULE);
      setStatus(`Monitoring started (${DEFAULT_SCHEDULE_LABEL}).`);
      onStarted(DEFAULT_SCHEDULE);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const surface = message.includes('entitlement')
        ? 'Entitlement required — see banner.'
        : message;
      setStatus(surface);
      onError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async (): Promise<void> => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await bridge.stopMonitoring();
      setStatus('Monitoring stopped.');
      onStopped();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const surface = message.includes('entitlement')
        ? 'Entitlement required — see banner.'
        : message;
      setStatus(surface);
      onError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView accessibilityLabel="Monitoring card" style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Monitoring</ThemedText>
        <ThemedView accessibilityLabel="Monitoring status pill" style={styles.pill}>
          <ThemedText style={styles.pillText}>
            {monitoringActive ? 'Active' : 'Inactive'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedText style={styles.schedule}>Schedule: {DEFAULT_SCHEDULE_LABEL}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start daily monitor"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handleStart}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <ThemedText style={styles.buttonText}>Start daily monitor</ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop monitor"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handleStop}
        style={[styles.secondaryButton, disabled && styles.buttonDisabled]}
      >
        <ThemedText style={styles.secondaryButtonText}>Stop monitor</ThemedText>
      </Pressable>
      {status != null && (
        <ThemedText accessibilityLabel="Monitoring status text" style={styles.status}>
          {status}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  pill: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: '#E0E1E6',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  schedule: {
    fontSize: 13,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
