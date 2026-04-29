import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type EventLogEntry = {
  kind: 'simulated' | 'activated' | 'deactivated';
  values: { mode: string; accentColor: string };
  at: string;
  focusName?: string;
};

interface EventLogProps {
  entries: ReadonlyArray<EventLogEntry>;
}

const KIND_LABELS: Record<EventLogEntry['kind'], string> = {
  simulated: 'Simulated',
  activated: 'Activated',
  deactivated: 'Deactivated',
};

const KIND_COLORS: Record<EventLogEntry['kind'], string> = {
  simulated: '#AF52DE',
  activated: '#34C759',
  deactivated: '#FF9500',
};

export default function EventLog({ entries }: EventLogProps) {
  if (entries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Event Log</ThemedText>
        <ThemedText style={styles.emptyState}>No events yet</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Event Log</ThemedText>
      {entries.map((entry, index) => {
        const kindLabel = KIND_LABELS[entry.kind];
        const kindColor = KIND_COLORS[entry.kind];
        const formattedTime = new Date(entry.at).toLocaleString();

        return (
          <View key={index} style={styles.entryRow}>
            <View style={[styles.kindBadge, { backgroundColor: kindColor }]}>
              <ThemedText style={styles.kindText} accessibilityLabel={`${kindLabel} event`}>
                {kindLabel}
              </ThemedText>
            </View>
            <View style={styles.entryDetails}>
              <ThemedText style={styles.entryTime}>{formattedTime}</ThemedText>
              <ThemedText style={styles.entryValues}>
                {entry.values.mode} • {entry.values.accentColor}
                {entry.focusName && ` • ${entry.focusName}`}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  emptyState: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  kindBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  kindText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  entryDetails: {
    flex: 1,
  },
  entryTime: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  entryValues: {
    fontSize: 14,
  },
});
