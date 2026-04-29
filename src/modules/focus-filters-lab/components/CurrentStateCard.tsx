import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';

const MODE_LABELS = {
  relaxed: 'Relaxed',
  focused: 'Focused',
  quiet: 'Quiet',
} as const;

const ACCENT_COLORS: Record<string, string> = {
  blue: '#007AFF',
  orange: '#FF9500',
  green: '#34C759',
  purple: '#AF52DE',
};

interface CurrentStateCardProps {
  payload: ShowcaseFilterPersistedPayload | null;
}

export default function CurrentStateCard({ payload }: CurrentStateCardProps) {
  if (!payload) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.emptyState}>No active filter</ThemedText>
      </ThemedView>
    );
  }

  const modeLabel = MODE_LABELS[payload.mode] || payload.mode;
  const accentHex = ACCENT_COLORS[payload.accentColor] || '#999';
  const eventLabel = payload.event === 'activated' ? 'Activated' : 'Deactivated';
  const eventColor = payload.event === 'activated' ? '#34C759' : '#FF9500';
  const formattedTime = new Date(payload.updatedAt).toLocaleString();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Current Filter State</ThemedText>

      <View style={styles.row}>
        <ThemedText style={styles.label}>Mode:</ThemedText>
        <ThemedText style={styles.value}>{modeLabel}</ThemedText>
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.label}>Accent:</ThemedText>
        <View style={styles.accentRow}>
          <View style={[styles.accentSwatch, { backgroundColor: accentHex }]} />
          <ThemedText style={styles.value}>{payload.accentColor}</ThemedText>
        </View>
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.label}>Event:</ThemedText>
        <View style={[styles.eventBadge, { backgroundColor: eventColor }]}>
          <ThemedText style={styles.eventText}>{eventLabel}</ThemedText>
        </View>
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.label}>Updated:</ThemedText>
        <ThemedText style={styles.value}>{formattedTime}</ThemedText>
      </View>

      {payload.focusName && (
        <View style={styles.row}>
          <ThemedText style={styles.label}>Focus:</ThemedText>
          <ThemedText style={styles.value}>{payload.focusName}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

CurrentStateCard.displayName = 'CurrentStateCard';

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  emptyState: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    width: 80,
  },
  value: {
    fontSize: 14,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accentSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  eventBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
