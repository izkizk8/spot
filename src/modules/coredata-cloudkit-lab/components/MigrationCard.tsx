/**
 * MigrationCard Component
 * Feature: 052-core-data-cloudkit
 *
 * Surfaces the current Core Data model version and the lightweight
 * migration policy.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface MigrationCardProps {
  modelVersion?: string;
  style?: ViewStyle;
}

export default function MigrationCard({ modelVersion = '1.0.0', style }: MigrationCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Schema Migration</ThemedText>
      <ThemedText style={styles.value}>Model version: {modelVersion}</ThemedText>
      <ThemedText style={styles.copy}>
        Core Data performs lightweight migration automatically when model changes are inferable
        (additive properties, renamed via mapping hints). The persistent store coordinator is
        configured with `NSMigratePersistentStoresAutomaticallyOption` and
        `NSInferMappingModelAutomaticallyOption`.
      </ThemedText>
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
    fontSize: 14,
    fontWeight: '600',
  },
  copy: {
    fontSize: 13,
    opacity: 0.8,
  },
});
