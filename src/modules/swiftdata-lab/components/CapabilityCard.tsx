/**
 * CapabilityCard Component
 * Feature: 053-swiftdata
 *
 * Surfaces the SwiftData schema availability and container info.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { SchemaInfo } from '@/native/swiftdata.types';

interface CapabilityCardProps {
  schema: SchemaInfo | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ schema, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>SwiftData Capability</ThemedText>
      {schema === null ? (
        <ThemedText style={styles.help}>Schema info not loaded yet.</ThemedText>
      ) : schema.available ? (
        <>
          <ThemedText style={styles.value}>Available</ThemedText>
          <ThemedText style={styles.help}>Container: {schema.containerName}</ThemedText>
          <ThemedText style={styles.help}>Models: {schema.modelNames.join(', ')}</ThemedText>
        </>
      ) : (
        <ThemedText style={styles.help}>
          SwiftData is unavailable on this device — requires iOS 17 or later.
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
