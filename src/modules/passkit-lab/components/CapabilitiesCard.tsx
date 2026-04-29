/**
 * CapabilitiesCard — PassKit capability pills + Refresh affordance.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Capabilities } from '@/native/passkit.types';

interface Props {
  readonly capabilities: Capabilities;
  readonly onRefresh: () => void;
}

export function CapabilitiesCard({ capabilities, onRefresh }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Capabilities</ThemedText>
      <View style={styles.row}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: capabilities.isPassLibraryAvailable ? '#34C759' : '#8E8E93',
            },
          ]}
          accessibilityLabel="passkit-library-status"
        >
          <ThemedText style={styles.pillText}>
            {capabilities.isPassLibraryAvailable ? 'Available' : 'Unavailable'}
          </ThemedText>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: capabilities.canAddPasses ? '#34C759' : '#8E8E93',
            },
          ]}
          accessibilityLabel="passkit-add-status"
        >
          <ThemedText style={styles.pillText}>
            {capabilities.canAddPasses ? 'Can add' : 'Cannot add'}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity onPress={onRefresh} accessibilityRole="button" style={styles.refresh}>
        <ThemedText style={styles.refreshText}>Refresh</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  refresh: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
    alignSelf: 'flex-start',
  },
  refreshText: { color: '#fff', fontWeight: '600' },
});
