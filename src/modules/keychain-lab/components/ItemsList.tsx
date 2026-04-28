/**
 * ItemsList — renders the list of keychain items or empty state.
 *
 * Empty state: "No keychain items yet — tap Add item to create one"
 * Non-empty: ItemRow per entry.
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { KeychainItemMeta } from '../types';
import ItemRow from './ItemRow';

interface ItemsListProps {
  items: KeychainItemMeta[];
  onReveal: (id: string) => Promise<string | null>;
  onDelete: (id: string) => void;
}

export default function ItemsList({ items, onReveal, onDelete }: ItemsListProps) {
  if (items.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer} type="backgroundElement">
        <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
          No keychain items yet — tap Add item to create one.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} onReveal={onReveal} onDelete={onDelete} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
  },
});
