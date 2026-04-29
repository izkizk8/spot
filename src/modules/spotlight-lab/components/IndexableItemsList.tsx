/**
 * IndexableItemsList — feature 031 / T029.
 *
 * Renders N ItemRow components from items array.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SearchableItem } from '@/native/spotlight.types';

import ItemRow from './ItemRow';

interface IndexableItemsListProps {
  readonly items: readonly SearchableItem[];
  readonly indexedIds: ReadonlySet<string>;
  readonly bulkPending: boolean;
  readonly onToggle: (id: string) => void;
  readonly style?: ViewStyle;
}

export default function IndexableItemsList({
  items,
  indexedIds,
  bulkPending,
  onToggle,
  style,
}: IndexableItemsListProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          state={indexedIds.has(item.id) ? 'indexed' : 'not-indexed'}
          bulkPending={bulkPending}
          onToggle={onToggle}
        />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
});
