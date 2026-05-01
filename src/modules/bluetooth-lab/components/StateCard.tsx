/**
 * StateCard — central manager state pill + Refresh affordance.
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CentralState } from '@/native/ble-central.types';

interface Props {
  readonly state: CentralState;
  readonly onRefresh: () => void;
}

const CAPTIONS: Record<CentralState, string> = {
  poweredOn: 'Bluetooth is on and ready.',
  poweredOff: 'Bluetooth radio is off — turn it on in Settings.',
  unauthorized: 'Bluetooth permission was denied.',
  unsupported: 'Bluetooth is not supported on this device.',
  resetting: 'Bluetooth radio is resetting…',
  unknown: 'Bluetooth state is unknown.',
};

const PILL_COLOR: Record<CentralState, string> = {
  poweredOn: '#34C759',
  poweredOff: '#FF9500',
  unauthorized: '#FF3B30',
  unsupported: '#8E8E93',
  resetting: '#5AC8FA',
  unknown: '#8E8E93',
};

export default function StateCard({ state, onRefresh }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Central State</ThemedText>
      <View style={styles.row}>
        <View
          style={[styles.pill, { backgroundColor: PILL_COLOR[state] }]}
          accessibilityLabel={`central-state-${state}`}
        >
          <ThemedText style={styles.pillText}>{state}</ThemedText>
        </View>
        <TouchableOpacity onPress={onRefresh} accessibilityRole='button' style={styles.refresh}>
          <ThemedText style={styles.refreshText}>Refresh</ThemedText>
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.caption}>{CAPTIONS[state]}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  pill: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.one },
  pillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  refresh: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  refreshText: { color: '#fff', fontWeight: '600' },
  caption: { fontSize: 12, opacity: 0.7 },
});
