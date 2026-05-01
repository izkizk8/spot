/**
 * CarPlay Lab — iOS screen — feature 045.
 *
 * Composes the four cards: EntitlementBanner, SceneComposer +
 * TemplatePreview pair, and SceneConfigForm + SetupInstructions.
 * Local state owns the picked template kind and the declared
 * category (audio is the default per the spec).
 *
 * No native bridge calls happen at mount — the entire scaffold is
 * pure presentational. Calling `presentTemplate` from the bridge
 * would throw `CarPlayNotEntitled` until Apple grants the
 * entitlement.
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CarPlayCategory, CarPlayTemplateKind } from '@/native/carplay.types';

import EntitlementBanner from './components/EntitlementBanner';
import SceneComposer from './components/SceneComposer';
import SceneConfigForm from './components/SceneConfigForm';
import SetupInstructions from './components/SetupInstructions';
import TemplatePreview from './components/TemplatePreview';

export const DEFAULT_CARPLAY_CATEGORY: CarPlayCategory = 'audio';
export const DEFAULT_CARPLAY_TEMPLATE: CarPlayTemplateKind = 'now-playing';

export default function CarPlayLabScreen() {
  const [category] = useState<CarPlayCategory>(DEFAULT_CARPLAY_CATEGORY);
  const [selectedKind, setSelectedKind] = useState<CarPlayTemplateKind>(DEFAULT_CARPLAY_TEMPLATE);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <EntitlementBanner style={styles.card} />
        <SceneComposer
          style={styles.card}
          category={category}
          selectedKind={selectedKind}
          onSelect={setSelectedKind}
        />
        <TemplatePreview style={styles.card} kind={selectedKind} />
        <SceneConfigForm style={styles.card} />
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
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.two,
  },
});
