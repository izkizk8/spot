/**
 * PeripheralRow — single row in DiscoveredList.
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DiscoveredPeripheral } from '@/native/ble-central.types';

interface Props {
  readonly row: DiscoveredPeripheral;
  readonly now: number;
  readonly connectInFlight: boolean;
  readonly onConnect: (row: DiscoveredPeripheral) => void;
}

function relativeAge(now: number, lastSeen: number): string {
  const diff = Math.max(0, now - lastSeen);
  const seconds = Math.round(diff / 1000);
  return `${seconds}s ago`;
}

function signalStrengthLabel(rssi: number): string {
  if (rssi >= -60) return 'Strong';
  if (rssi >= -80) return 'Medium';
  return 'Weak';
}

export default function PeripheralRow({ row, now, connectInFlight, onConnect }: Props) {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.left}>
        <ThemedText style={styles.name}>{row.name ?? '(no name)'}</ThemedText>
        <ThemedText style={styles.id}>{row.id.slice(0, 8)}</ThemedText>
        <View style={styles.metaRow}>
          <ThemedText style={styles.meta}>{row.rssi} dBm</ThemedText>
          <ThemedText style={styles.meta}>{signalStrengthLabel(row.rssi)}</ThemedText>
          <ThemedText style={styles.meta}>{relativeAge(now, row.lastSeen)}</ThemedText>
        </View>
        {row.serviceUUIDs.length > 0 ? (
          <ThemedText style={styles.services}>
            {row.serviceUUIDs.map((u) => (u.length === 36 ? u.slice(4, 8) : u)).join(', ')}
          </ThemedText>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={() => onConnect(row)}
        disabled={connectInFlight}
        style={[styles.button, connectInFlight && styles.buttonDisabled]}
        accessibilityRole='button'
        accessibilityState={{ disabled: connectInFlight }}
      >
        <ThemedText style={styles.buttonText}>Connect</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginVertical: Spacing.one,
  },
  left: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600' },
  id: { fontSize: 12, opacity: 0.6 },
  metaRow: { flexDirection: 'row', gap: Spacing.two },
  meta: { fontSize: 12, opacity: 0.8 },
  services: { fontSize: 11, opacity: 0.7, marginTop: Spacing.one },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
