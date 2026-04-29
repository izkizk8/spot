/**
 * PassKit Lab Screen — Android variant.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import { AddFromUrlCard } from './components/AddFromUrlCard';
import { AddSamplePassCard } from './components/AddSamplePassCard';
import { CapabilitiesCard } from './components/CapabilitiesCard';
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { MyPassesList } from './components/MyPassesList';
import { SetupGuideCard } from './components/SetupGuideCard';

// Stub capabilities and actions for Android
const stubCapabilities = {
  isPassLibraryAvailable: false,
  canAddPasses: false,
};

const stubPasses: never[] = [];
const noOp = () => {};
const noOpWithArg = (_arg: any) => {};

export default function PassKitLabScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <IOSOnlyBanner />
      <CapabilitiesCard capabilities={stubCapabilities} onRefresh={noOp} />
      <AddSamplePassCard
        bundledSample={null}
        onAddFromBytes={noOpWithArg}
        lastError={null}
        lastResult={null}
      />
      <MyPassesList passes={stubPasses} onRefresh={noOp} onOpen={noOpWithArg} canOpen={false} />
      <AddFromUrlCard onAddFromURL={noOpWithArg} lastError={null} lastResult={null} />
      <SetupGuideCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
});
