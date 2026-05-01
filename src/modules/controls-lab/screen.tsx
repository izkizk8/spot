/**
 * Controls Lab — iOS screen (feature 087).
 *
 * Composes: capability card, controls list, setup guide.
 * The native bridge is exercised through the useControls hook.
 */
import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import ControlItem from './components/ControlItem';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupGuide from './components/SetupGuide';
import { useControls } from './hooks/useControls';

export default function ControlsLabScreen() {
  const store = useControls();
  const { refreshCapabilities, refreshControls } = store;

  useEffect(() => {
    void refreshCapabilities();
    void refreshControls();
  }, [refreshCapabilities, refreshControls]);

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
        {store.controls.map((ctrl) => (
          <ControlItem
            key={ctrl.id}
            style={styles.card}
            control={ctrl}
            loading={store.loading}
            lastResult={store.lastActionResult}
            onTrigger={() => {
              void store.triggerControl(ctrl.id);
            }}
          />
        ))}
        <SetupGuide style={styles.card} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  card: { marginBottom: Spacing.two },
});
