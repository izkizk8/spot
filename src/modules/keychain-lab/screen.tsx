/**
 * Keychain Services Lab — iOS screen (feature 023, T029).
 *
 * Composes ItemsList + AddItemForm + AccessGroupCard, driven by the
 * useKeychainItems hook. Mirrors the per-module screen pattern used in
 * 021/022.
 *
 * Covers FR-005, US1, US2, US4, SC-007.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AccessGroupCard from './components/AccessGroupCard';
import AddItemForm from './components/AddItemForm';
import ItemsList from './components/ItemsList';
import { useKeychainItems } from './hooks/useKeychainItems';

const DEFAULT_ACCESS_GROUP = 'group.com.spot.keychain.lab';

export interface KeychainLabScreenProps {
  accessGroup?: string;
}

export default function KeychainLabScreen({
  accessGroup = DEFAULT_ACCESS_GROUP,
}: KeychainLabScreenProps = {}) {
  const { items, addItem, revealItem, deleteItem } = useKeychainItems();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ItemsList items={items} onReveal={revealItem} onDelete={deleteItem} />
        <AddItemForm onSave={addItem} />
        <AccessGroupCard accessGroup={accessGroup} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
});
