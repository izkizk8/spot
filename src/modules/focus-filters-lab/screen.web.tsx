/**
 * Focus Filters Lab Screen — Web variant.
 *
 * Identical to Android: fallback layout: banner + explainer + filter def + demo + log.
 */

import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Spacing } from '@/constants/theme';
import { DRAFT_DEFAULTS } from '@/modules/focus-filters-lab/filter-modes';
import { useFocusFilter } from '@/modules/focus-filters-lab/hooks/useFocusFilter';
import ExplainerCard from '@/modules/focus-filters-lab/components/ExplainerCard';
import FilterDefinitionCard from '@/modules/focus-filters-lab/components/FilterDefinitionCard';
import PretendFilterToggle from '@/modules/focus-filters-lab/components/PretendFilterToggle';
import EventLog from '@/modules/focus-filters-lab/components/EventLog';
import IOSOnlyBanner from '@/modules/focus-filters-lab/components/IOSOnlyBanner';
import type { ShowcaseFilterMode } from '@/modules/focus-filters-lab/filter-modes';

export default function FocusFiltersLabScreen() {
  const [draft, setDraft] = useState<{ mode: ShowcaseFilterMode; accentColor: string }>(
    DRAFT_DEFAULTS,
  );
  const { values, eventLog, simulateActivation } = useFocusFilter();

  const handleModeChange = (mode: ShowcaseFilterMode) => {
    setDraft((prev) => ({ ...prev, mode }));
  };

  const handleAccentChange = (accentColor: string) => {
    setDraft((prev) => ({ ...prev, accentColor }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <IOSOnlyBanner style={styles.card} />
      <ExplainerCard style={styles.card} />
      <FilterDefinitionCard
        mode={draft.mode}
        accentColor={draft.accentColor}
        onChangeMode={handleModeChange}
        onChangeAccent={handleAccentChange}
      />
      <PretendFilterToggle
        draft={draft}
        persistedPayload={values}
        onActivate={simulateActivation}
      />
      <EventLog entries={eventLog} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
  },
});
