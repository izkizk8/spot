/**
 * SyncStatusPill Component
 * Feature: 052-core-data-cloudkit
 *
 * Compact pill indicating the current sync state.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { SyncState } from '@/native/coredata-cloudkit.types';

interface SyncStatusPillProps {
  state: SyncState;
  style?: ViewStyle;
}

const LABEL: Record<SyncState, string> = {
  idle: 'Idle',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Error',
  offline: 'Offline',
};

const COLOR: Record<SyncState, string> = {
  idle: '#888888',
  syncing: '#FF9500',
  synced: '#34C759',
  error: '#FF3B30',
  offline: '#8E8E93',
};

export default function SyncStatusPill({ state, style }: SyncStatusPillProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={[styles.dot, { color: COLOR[state] }]}>●</ThemedText>
      <ThemedText style={styles.label}>{LABEL[state]}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  dot: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
