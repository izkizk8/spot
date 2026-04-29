/**
 * CapabilitiesCard Component
 * Feature: 034-arkit-basics
 *
 * Read-only summary of ARWorldTrackingConfiguration.isSupported, frame semantics
 * (people occlusion when supported), and session state status pill.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { SessionInfo } from '@/native/arkit.types';

interface CapabilitiesCardProps {
  readonly worldTrackingSupported: boolean;
  readonly peopleOcclusionSupported: boolean;
  readonly info: SessionInfo;
}

export default function CapabilitiesCard({
  worldTrackingSupported,
  peopleOcclusionSupported,
  info,
}: CapabilitiesCardProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Capabilities</ThemedText>

      <View style={styles.row}>
        <ThemedText style={styles.label}>World Tracking:</ThemedText>
        <ThemedText style={styles.value}>
          {worldTrackingSupported ? 'Supported' : 'Not Supported'}
        </ThemedText>
      </View>

      {peopleOcclusionSupported && (
        <View style={styles.row}>
          <ThemedText style={styles.label}>Frame Semantics:</ThemedText>
          <ThemedText style={styles.value}>People Occlusion</ThemedText>
        </View>
      )}

      <View style={styles.row}>
        <ThemedText style={styles.label}>Session State:</ThemedText>
        <View style={[styles.pill, getPillStyle(info.state)]}>
          <ThemedText style={styles.pillText}>
            {info.state.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      {info.state === 'error' && info.lastError && (
        <ThemedText style={styles.errorMessage}>{info.lastError}</ThemedText>
      )}
    </ThemedView>
  );
}

function getPillStyle(state: SessionInfo['state']): { backgroundColor: string } {
  switch (state) {
    case 'idle':
      return { backgroundColor: '#888' };
    case 'running':
      return { backgroundColor: '#34C759' };
    case 'paused':
      return { backgroundColor: '#FF9500' };
    case 'error':
      return { backgroundColor: '#FF3B30' };
    default:
      return { backgroundColor: '#888' };
  }
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.one,
  },
  label: {
    fontSize: 14,
    marginRight: Spacing.two,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  errorMessage: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: Spacing.two,
  },
});
