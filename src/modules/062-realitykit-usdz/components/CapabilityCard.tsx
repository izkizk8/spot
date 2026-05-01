/**
 * CapabilityCard Component
 * Feature: 062-realitykit-usdz
 *
 * Displays RealityKit AR capability flags queried from the native bridge.
 */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { RKCapabilities } from '@/native/realitykit-usdz.types';

interface CapabilityCardProps {
  capabilities: RKCapabilities | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ capabilities, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.card, style]}>
      <ThemedText style={styles.heading}>RealityKit AR Capability</ThemedText>
      {capabilities === null ? (
        <ThemedText style={styles.loading}>Loading capabilities…</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.row}>
            AR World Tracking: {capabilities.arWorldTrackingSupported ? '✓' : '✗'}
          </ThemedText>
          <ThemedText style={styles.row}>
            LiDAR: {capabilities.lidarSupported ? '✓' : '✗'}
          </ThemedText>
          <ThemedText style={styles.row}>
            AR Quick Look: {capabilities.arQuickLookSupported ? '✓' : '✗'}
          </ThemedText>
          <ThemedText style={styles.row}>Tier: {capabilities.tier}</ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.one,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  loading: {
    opacity: 0.6,
  },
  row: {
    fontSize: 15,
  },
});
