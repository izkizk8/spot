/**
 * IntentEventLog — newest-first list of IntentInvocation rows.
 *
 * The component does not independently truncate; the cap is the
 * caller's responsibility (eventLogReducer enforces it).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { IntentInvocation } from '@/modules/app-intents-lab/event-log';

export interface IntentEventLogProps {
  readonly log: readonly IntentInvocation[];
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function paramSummary(params: IntentInvocation['parameters']): string {
  if (!params) return 'none';
  return JSON.stringify(params);
}

export function IntentEventLog({ log }: IntentEventLogProps) {
  if (log.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.heading}>Recent intent invocations</ThemedText>
        <ThemedText style={styles.empty}>No intent invocations yet</ThemedText>
      </ThemedView>
    );
  }
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Recent intent invocations</ThemedText>
      {log.map((entry) => {
        const isFailure = entry.status === 'failure';
        const params = paramSummary(entry.parameters);
        const time = formatTime(entry.timestamp);
        const a11yLabel = `${entry.intentName} with ${params} at ${time}: ${entry.result}`;
        return (
          <ThemedView
            key={entry.id}
            style={[styles.row, isFailure && styles.rowFailure]}
            accessibilityLabel={a11yLabel}
            testID={`event-log-row-${entry.id}`}
          >
            <ThemedText style={styles.intentName}>{entry.intentName}</ThemedText>
            <ThemedText style={styles.meta}>
              {time} · {params}
            </ThemedText>
            <ThemedText
              style={[styles.result, isFailure && styles.resultFailure]}
              accessibilityLabel={isFailure ? 'Status: failure' : 'Status: success'}
            >
              {entry.result}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.two,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  row: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#D0D1D6',
    gap: Spacing.half,
  },
  rowFailure: {
    borderColor: '#D70015',
  },
  intentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    opacity: 0.7,
  },
  result: {
    fontSize: 14,
  },
  resultFailure: {
    color: '#D70015',
  },
});
