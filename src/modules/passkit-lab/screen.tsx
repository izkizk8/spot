/**
 * PassKit Lab Screen — iOS variant.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import { AddFromUrlCard } from './components/AddFromUrlCard';
import { AddSamplePassCard } from './components/AddSamplePassCard';
import { CapabilitiesCard } from './components/CapabilitiesCard';
import { EntitlementBanner } from './components/EntitlementBanner';
import { MyPassesList } from './components/MyPassesList';
import { SetupGuideCard } from './components/SetupGuideCard';
import { usePassKit } from './hooks/usePassKit';

export default function PassKitLabScreen() {
  const passkit = usePassKit();

  // Build-time flag for bundled sample (defaults to false per FR-006)
  const bundledSample: string | null = (globalThis as any).__PASSKIT_BUNDLED_SAMPLE__ ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {passkit.entitlementStatus.isPlaceholder && <EntitlementBanner isPlaceholder={true} />}
      <CapabilitiesCard capabilities={passkit.capabilities} onRefresh={passkit.refresh} />
      <AddSamplePassCard
        bundledSample={bundledSample}
        onAddFromBytes={passkit.addFromBytes}
        lastError={passkit.lastError}
        lastResult={passkit.lastResult}
      />
      <MyPassesList
        passes={passkit.passes}
        onRefresh={passkit.refresh}
        onOpen={passkit.openPass}
        canOpen={true}
      />
      <AddFromUrlCard
        onAddFromURL={passkit.addFromURL}
        lastError={passkit.lastError}
        lastResult={passkit.lastResult}
      />
      <SetupGuideCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
});
