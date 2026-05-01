/**
 * Visual Look Up Lab — iOS screen (feature 060).
 *
 * Composes the showcase sections: capability card, subjects list,
 * demo analyse button, and setup instructions. The native bridge is
 * exercised through the `useVisualLookUp` hook.
 */

import React, { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupInstructions from './components/SetupInstructions';
import SubjectsList from './components/SubjectsList';
import { useVisualLookUp } from './hooks/useVisualLookUp';

/** Placeholder URI used in the demo — no camera roll permission required. */
const DEMO_IMAGE_URI = 'asset://visual-look-up-demo.jpg';

export default function VisualLookUpLabScreen() {
  const store = useVisualLookUp();
  const { checkSupport } = store;

  useEffect(() => {
    void checkSupport();
  }, [checkSupport]);

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
        <CapabilityCard
          style={styles.card}
          supported={store.supported}
          lastImageUri={store.result?.imageUri ?? null}
        />
        <SubjectsList
          style={styles.card}
          subjects={store.result?.subjects ?? []}
          loading={store.loading}
        />
        <ThemedView style={[styles.card, styles.actions]}>
          <Pressable
            style={styles.button}
            onPress={() => {
              void store.analyzeImage(DEMO_IMAGE_URI);
            }}
          >
            <ThemedText style={styles.buttonLabel}>Analyse Demo</ThemedText>
          </Pressable>
          {store.result !== null && (
            <Pressable style={styles.buttonSecondary} onPress={store.clearResult}>
              <ThemedText style={styles.buttonLabel}>Clear</ThemedText>
            </Pressable>
          )}
          {store.lastError !== null && (
            <ThemedText style={styles.error}>{store.lastError.message}</ThemedText>
          )}
        </ThemedView>
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
  actions: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 13,
    color: '#E53935',
    opacity: 0.9,
  },
});
