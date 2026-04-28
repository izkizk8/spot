import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { PendingNotification } from '../types';

interface Props {
  pending: ReadonlyArray<PendingNotification>;
  onCancel: (id: string) => void;
  onCancelAll: () => void;
}

export function PendingList({ pending, onCancel, onCancelAll }: Props) {
  if (pending.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText>No pending notifications</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        {pending.map((notif) => (
          <View key={notif.identifier} style={styles.row}>
            <ThemedText>{notif.title}</ThemedText>
            <ThemedText style={styles.summary}>{notif.triggerSummary}</ThemedText>
            <TouchableOpacity onPress={() => onCancel(notif.identifier)} style={styles.button}>
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={onCancelAll} style={styles.cancelAll}>
        <ThemedText>Cancel All</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { padding: 24, alignItems: 'center' },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', gap: 4 },
  summary: { fontSize: 12, color: '#666' },
  button: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelAll: { padding: 16, backgroundColor: '#FF3B30', alignItems: 'center' },
});
