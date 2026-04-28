/**
 * RegionRow component (feature 025).
 *
 * Displays a single monitored region with id, radius, and state pill.
 */
import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { MonitoredRegion } from '../types';

export interface RegionRowProps {
  region: MonitoredRegion;
}

const stateColors = {
  inside: '#34C759',
  outside: '#FF9500',
  unknown: '#8E8E93',
};

export function RegionRow({ region }: RegionRowProps) {
  return (
    <ThemedView style={styles.row}>
      <ThemedView style={styles.info}>
        <ThemedText style={styles.id} numberOfLines={1}>
          {region.id}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.radius}>
          {region.radius}m
        </ThemedText>
      </ThemedView>
      <ThemedView
        style={[styles.pill, { backgroundColor: stateColors[region.state] }]}
        testID="state-pill"
      >
        <ThemedText style={styles.pillText}>{region.state}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  id: {
    fontSize: 14,
    flex: 1,
  },
  radius: {
    fontSize: 12,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
