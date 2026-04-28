import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { NotificationEvent } from '../types';

interface Props {
  events: ReadonlyArray<NotificationEvent>;
}

export function EventLog({ events }: Props) {
  const displayEvents = events.slice(0, 20);

  if (displayEvents.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText>No events yet</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {displayEvents.map((event, index) => (
        <ThemedView key={`${event.identifier}-${index}`} style={styles.row}>
          <ThemedText style={styles.time}>{event.at.toLocaleTimeString()}</ThemedText>
          {event.kind === 'received' && <ThemedText>Received: {event.identifier}</ThemedText>}
          {event.kind === 'action-response' && (
            <ThemedText>
              Action: {event.actionIdentifier}
              {event.textInput && ` - "${event.textInput}"`}
            </ThemedText>
          )}
          {event.kind === 'dismissed' && <ThemedText>Dismissed: {event.identifier}</ThemedText>}
        </ThemedView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
