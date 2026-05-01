/**
 * CapabilityCard Component
 * Feature: 082-pencilkit
 *
 * Surfaces the PencilKit canvas availability and capabilities.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { CanvasInfo } from '@/native/pencilkit.types';

interface CapabilityCardProps {
  canvasInfo: CanvasInfo | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ canvasInfo, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>PencilKit Capability</ThemedText>
      {canvasInfo === null ? (
        <ThemedText style={styles.help}>Canvas info not loaded yet.</ThemedText>
      ) : canvasInfo.available ? (
        <>
          <ThemedText style={styles.value}>Available</ThemedText>
          <ThemedText style={styles.help}>
            Apple Pencil: {canvasInfo.supportsPencil ? 'Supported' : 'Not detected'}
          </ThemedText>
          <ThemedText style={styles.help}>Drawing policy: {canvasInfo.drawingPolicy}</ThemedText>
        </>
      ) : (
        <ThemedText style={styles.help}>
          PencilKit is unavailable on this device — requires iOS 17 or later.
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
});
