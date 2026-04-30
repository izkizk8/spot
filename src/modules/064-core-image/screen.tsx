/**
 * CoreImage Lab — iOS screen (feature 064).
 *
 * Composes the showcase sections: capability card, filter picker,
 * filter card (params + apply), result preview, and setup
 * instructions. The native bridge is exercised through the
 * `useCoreImageFilters` hook.
 */
import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import FilterCard from './components/FilterCard';
import FilterPicker from './components/FilterPicker';
import FilterPreview from './components/FilterPreview';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupInstructions from './components/SetupInstructions';
import { useCoreImageFilters } from './hooks/useCoreImageFilters';

export default function CoreImageLabScreen() {
  const store = useCoreImageFilters();
  const { refreshCapabilities } = store;

  useEffect(() => {
    void refreshCapabilities();
  }, [refreshCapabilities]);

  if (Platform.OS !== 'ios') {
    return (
      <ThemedView style={styles.container}>
        <IOSOnlyBanner />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilityCard style={styles.card} capabilities={store.capabilities} />
        <FilterPicker
          style={styles.card}
          value={store.selectedFilterId}
          onChange={store.selectFilter}
        />
        <FilterCard
          style={styles.card}
          filterId={store.selectedFilterId}
          params={store.params}
          loading={store.loading}
          onParamChange={store.setParam}
          onApply={() => {
            void store.applyFilter();
          }}
        />
        <FilterPreview style={styles.card} result={store.result} />
        <SetupInstructions style={styles.card} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: Spacing.two,
  },
  card: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
});
