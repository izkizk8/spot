/**
 * Spotlight Lab Screen — iOS variant.
 * feature 031 / T042.
 *
 * Six panels: ExplainerCard → IndexableItemsList → BulkActionsCard →
 * SearchTestCard → UserActivityCard → PersistenceNoteCard.
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import BulkActionsCard from './components/BulkActionsCard';
import ExplainerCard from './components/ExplainerCard';
import IndexableItemsList from './components/IndexableItemsList';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import PersistenceNoteCard from './components/PersistenceNoteCard';
import SearchTestCard from './components/SearchTestCard';
import UserActivityCard from './components/UserActivityCard';
import { useSpotlightIndex } from './hooks/useSpotlightIndex';

export default function SpotlightLabScreen() {
  const {
    items,
    indexedIds,
    isAvailable,
    isBusy,
    error,
    toggleItem,
    indexAll,
    removeAll,
    search,
    results,
    markActivity,
    clearActivity,
    activityActive,
  } = useSpotlightIndex();

  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchError(null);
      setHasSearched(true);
      try {
        await search(query);
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : 'Search failed');
      }
    },
    [search],
  );

  // Degraded state: isAvailable === false
  if (!isAvailable) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <IOSOnlyBanner reason="system-disabled" />
        <ExplainerCard style={styles.card} />
        <PersistenceNoteCard style={styles.card} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ExplainerCard style={styles.card} />
      <ThemedView style={styles.card}>
        <IndexableItemsList
          items={items}
          indexedIds={indexedIds}
          bulkPending={isBusy}
          onToggle={toggleItem}
        />
      </ThemedView>
      <BulkActionsCard
        style={styles.card}
        pending={isBusy}
        onIndexAll={indexAll}
        onRemoveAll={removeAll}
      />
      <SearchTestCard
        style={styles.card}
        pending={isBusy}
        results={results}
        error={searchError ?? (error?.message ?? null)}
        onSearch={handleSearch}
        hasSearched={hasSearched}
      />
      <UserActivityCard
        style={styles.card}
        state={activityActive}
        onMark={markActivity}
        onClear={clearActivity}
      />
      <PersistenceNoteCard style={styles.card} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    overflow: 'hidden',
  },
});
