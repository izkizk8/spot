/**
 * ExplainerCard — feature 030 / T026.
 *
 * Renders the BGTaskScheduler / BGAppRefreshTask / BGProcessingTask
 * explainer plus the two task identifier literals so forks see the
 * EC-009 caveat.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  TASK_IDENTIFIER_PROCESSING,
  TASK_IDENTIFIER_REFRESH,
} from '@/native/background-tasks.types';

interface ExplainerCardProps {
  readonly style?: ViewStyle;
}

export default function ExplainerCard({ style }: ExplainerCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>About Background Tasks</ThemedText>
      <ThemedText style={styles.body}>
        iOS 13+ exposes the BGTaskScheduler API. App refresh runs short
        opportunistic work via BGAppRefreshTask; longer chores run via
        BGProcessingTask. The system coalesces and may keep work deferred
        until conditions are favourable.
      </ThemedText>
      <ThemedText style={styles.identifier}>{TASK_IDENTIFIER_REFRESH}</ThemedText>
      <ThemedText style={styles.identifier}>{TASK_IDENTIFIER_PROCESSING}</ThemedText>
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
    marginBottom: Spacing.two,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: Spacing.two,
  },
  identifier: {
    fontSize: 12,
    opacity: 0.7,
  },
});
