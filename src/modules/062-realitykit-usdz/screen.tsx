/**
 * RealityKit USDZ Lab — iOS screen (feature 062).
 *
 * Composes the AR preview showcase: capability card, model picker,
 * preview button, and setup instructions. The native bridge is
 * exercised through the `useRealityKitUsdz` hook.
 */
import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import ModelPicker from './components/ModelPicker';
import PreviewButton from './components/PreviewButton';
import SetupInstructions from './components/SetupInstructions';
import { useRealityKitUsdz } from './hooks/useRealityKitUsdz';

export default function RealityKitUsdzScreen() {
  const store = useRealityKitUsdz();
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
        <ModelPicker style={styles.card} value={store.selectedModel} onChange={store.selectModel} />
        <PreviewButton
          style={styles.card}
          loading={store.loading}
          onPress={() => {
            void store.openPreview();
          }}
        />
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
