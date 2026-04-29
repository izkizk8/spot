/**
 * ItemRow — feature 031 / T030.
 *
 * Renders a single searchable item with toggle.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SearchableItem } from '@/native/spotlight.types';

type IndexedState = 'indexed' | 'not-indexed';

interface ItemRowProps {
  readonly item: SearchableItem;
  readonly state: IndexedState;
  readonly bulkPending: boolean;
  readonly onToggle: (id: string) => void;
  readonly style?: ViewStyle;
}

export default function ItemRow({ item, state, bulkPending, onToggle, style }: ItemRowProps) {
  const handleToggle = () => {
    onToggle(item.id);
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.description}>{item.contentDescription}</ThemedText>
        {item.keywords.length > 0 && (
          <ThemedView style={styles.keywords}>
            {item.keywords.map((kw) => (
              <ThemedView key={kw} style={styles.chip}>
                <ThemedText style={styles.chipText}>{kw}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ThemedView>
      <ThemedView style={styles.actions}>
        <ThemedView style={[styles.badge, state === 'indexed' ? styles.badgeIndexed : styles.badgeNotIndexed]}>
          <ThemedText style={styles.badgeText}>
            {state === 'indexed' ? 'Indexed' : 'Not Indexed'}
          </ThemedText>
        </ThemedView>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: bulkPending }}
          onPress={handleToggle}
          disabled={bulkPending}
          style={[styles.toggleButton, bulkPending && styles.toggleButtonDisabled]}
        >
          <ThemedText style={styles.toggleText}>
            {state === 'indexed' ? 'Remove' : 'Index'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginRight: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  description: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: Spacing.one,
  },
  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  chipText: {
    fontSize: 11,
    color: '#007AFF',
  },
  actions: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  badgeIndexed: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  badgeNotIndexed: {
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  toggleButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: '#007AFF',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
