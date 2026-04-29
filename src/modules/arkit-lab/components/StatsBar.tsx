/**
 * StatsBar Component
 * Feature: 034-arkit-basics
 *
 * Fixed-height bottom row showing FPS (rolling 1-second average), tracking state
 * (normal / limited:<reason> / notAvailable), and session duration (mm:ss).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { SessionInfo } from '@/native/arkit.types';

interface StatsBarProps {
  readonly info: SessionInfo;
}

export default function StatsBar({ info }: StatsBarProps) {
  const formattedDuration = formatDuration(info.duration);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.stat}>
        <ThemedText style={styles.label}>FPS</ThemedText>
        <ThemedText style={styles.value}>{info.fps.toFixed(1)}</ThemedText>
      </View>

      <View style={styles.stat}>
        <ThemedText style={styles.label}>Tracking</ThemedText>
        <ThemedText style={styles.value}>{info.trackingState}</ThemedText>
      </View>

      <View style={styles.stat}>
        <ThemedText style={styles.label}>Duration</ThemedText>
        <ThemedText style={styles.value}>{formattedDuration}</ThemedText>
      </View>
    </ThemedView>
  );
}

/**
 * Format duration in seconds as mm:ss.
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  stat: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: Spacing.half,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
