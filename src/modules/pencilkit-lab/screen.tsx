/**
 * PencilKit Lab — iOS screen (feature 082).
 *
 * Composes the showcase sections: capability card, policy picker,
 * tool picker, drawing canvas placeholder, stats, and setup notes.
 * The native bridge is exercised through the `usePencilKit` hook.
 */

import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import DrawingCanvas from './components/DrawingCanvas';
import DrawingStats from './components/DrawingStats';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import PolicyPicker from './components/PolicyPicker';
import SetupInstructions from './components/SetupInstructions';
import ToolPicker from './components/ToolPicker';
import { usePencilKit } from './hooks/usePencilKit';

export default function PencilKitLabScreen() {
  const store = usePencilKit();
  const { initCanvas } = store;

  useEffect(() => {
    void initCanvas();
  }, [initCanvas]);

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
        <CapabilityCard style={styles.card} canvasInfo={store.canvasInfo} />
        <PolicyPicker
          style={styles.card}
          value={store.canvasInfo?.drawingPolicy ?? 'default'}
          onChange={(p) => {
            void store.setPolicy(p);
          }}
        />
        <ToolPicker
          style={styles.card}
          value={store.currentTool.type}
          onChange={(t) => {
            void store.setTool(t, store.currentTool.width, store.currentTool.color);
          }}
        />
        <DrawingCanvas style={styles.card} stats={store.drawingStats} />
        <DrawingStats style={styles.card} stats={store.drawingStats} />
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
