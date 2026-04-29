/**
 * DiscoveredList — soft-capped list of discovered peripherals.
 * Feature: 035-core-bluetooth
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DiscoveredPeripheral } from '@/native/ble-central.types';
import { DISCOVERED_LIST_CAP } from '@/modules/bluetooth-lab/store/peripherals-store';
import PeripheralRow from './PeripheralRow';

interface Props {
  readonly rows: readonly DiscoveredPeripheral[];
  readonly connectInFlight: boolean;
  readonly onConnect: (row: DiscoveredPeripheral) => void;
}

export default function DiscoveredList({ rows, connectInFlight, onConnect }: Props) {
  // Slice to soft-cap at the render boundary (no virtualization).
  const visible = rows.slice(0, DISCOVERED_LIST_CAP);
  const capped = rows.length > DISCOVERED_LIST_CAP;

  // `now` is refreshed once a second via a state-driven interval so the
  // PeripheralRow's relative-age caption updates without making the
  // component impure during render.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Discovered ({rows.length})</ThemedText>
      {visible.length === 0 ? (
        <ThemedText style={styles.empty}>No peripherals discovered yet.</ThemedText>
      ) : (
        <View>
          {visible.map((row) => (
            <PeripheralRow
              key={row.id}
              row={row}
              now={now}
              connectInFlight={connectInFlight}
              onConnect={onConnect}
            />
          ))}
        </View>
      )}
      {capped ? (
        <ThemedText style={styles.caption}>Showing first {DISCOVERED_LIST_CAP} rows.</ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  empty: { fontSize: 14, opacity: 0.6 },
  caption: { fontSize: 12, opacity: 0.7, marginTop: Spacing.two },
});
