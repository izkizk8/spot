/**
 * Keychain Services Lab — Android screen (feature 023, T029).
 *
 * Composes ItemsList + AddItemForm only; no AccessGroupCard (US5-AS2).
 * AccessibilityPicker is automatically disabled by its own Platform.OS check.
 *
 * Covers FR-005, US5-AS2, US4-AS4.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AddItemForm from './components/AddItemForm';
import ItemsList from './components/ItemsList';
import { useKeychainItems } from './hooks/useKeychainItems';

export default function KeychainLabScreenAndroid() {
  const { items, addItem, revealItem, deleteItem } = useKeychainItems();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ItemsList items={items} onReveal={revealItem} onDelete={deleteItem} />
        <AddItemForm onSave={addItem} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
});
