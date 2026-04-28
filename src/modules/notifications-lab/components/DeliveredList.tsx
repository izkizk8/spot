import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { DeliveredNotification } from '../types';

interface Props {
  delivered: ReadonlyArray<DeliveredNotification>;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function DeliveredList({ delivered, onRemove, onClearAll }: Props) {
  if (delivered.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText>No delivered notifications</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        {delivered.map((notif) => (
          <View key={notif.identifier} style={styles.row}>
            <ThemedText>{notif.title}</ThemedText>
            <ThemedText style={styles.time}>{notif.deliveredAt.toLocaleTimeString()}</ThemedText>
            <TouchableOpacity onPress={() => onRemove(notif.identifier)} style={styles.button}>
              <ThemedText>Remove</ThemedText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={onClearAll} style={styles.clearAll}>
        <ThemedText>Clear All</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { padding: 24, alignItems: 'center' },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', gap: 4 },
  time: { fontSize: 12, color: '#666' },
  button: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    alignItems: 'center',
  },
  clearAll: { padding: 16, backgroundColor: '#FF3B30', alignItems: 'center' },
});
