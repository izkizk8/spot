/**
 * EventLog — capped per-characteristic event log with 100 ms render coalescing.
 * Feature: 035-core-bluetooth
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CharacteristicEvent } from '@/native/ble-central.types';

const COALESCE_WINDOW_MS = 100;
export const EVENT_LOG_RENDER_CAP = 20;

interface Props {
  readonly events: readonly CharacteristicEvent[];
  readonly onClear: () => void;
}

function formatBytes(bytesHex: string): string {
  if (!bytesHex) return '';
  const out: string[] = [];
  for (let i = 0; i < bytesHex.length; i += 2) {
    out.push(bytesHex.slice(i, i + 2));
  }
  return out.join(' ');
}

function formatTimestamp(at: number): string {
  return new Date(at).toISOString();
}

export default function EventLog({ events, onClear }: Props) {
  // Coalesce re-renders to 100 ms windows; the underlying buffer never drops bytes.
  const [visible, setVisible] = useState<readonly CharacteristicEvent[]>(events);
  const pendingRef = useRef<readonly CharacteristicEvent[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pendingRef.current = events;
    if (timerRef.current != null) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (pendingRef.current) setVisible(pendingRef.current);
    }, COALESCE_WINDOW_MS);
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [events]);

  const rows = visible.slice(-EVENT_LOG_RENDER_CAP);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Events ({rows.length})</ThemedText>
        <TouchableOpacity onPress={onClear} style={styles.button} accessibilityRole="button">
          <ThemedText style={styles.buttonText}>Clear</ThemedText>
        </TouchableOpacity>
      </View>
      {rows.length === 0 ? (
        <ThemedText style={styles.empty}>No events yet.</ThemedText>
      ) : (
        rows.map((e, i) => (
          <View key={`${e.at}-${i}`} style={styles.row}>
            <ThemedText style={styles.kind}>{e.kind.toUpperCase()}</ThemedText>
            <ThemedText style={styles.bytes}>{formatBytes(e.bytesHex)}</ThemedText>
            <ThemedText style={styles.time}>{formatTimestamp(e.at)}</ThemedText>
            {e.message ? <ThemedText style={styles.msg}>{e.message}</ThemedText> : null}
          </View>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 16, fontWeight: '600' },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  empty: { fontSize: 14, opacity: 0.6 },
  row: { paddingVertical: Spacing.one },
  kind: { fontSize: 12, fontWeight: '700' },
  bytes: { fontSize: 12, fontFamily: 'Courier' },
  time: { fontSize: 11, opacity: 0.6 },
  msg: { fontSize: 12, opacity: 0.8 },
});
