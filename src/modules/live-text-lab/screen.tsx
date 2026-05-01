/**
 * Live Text Lab — iOS screen (feature 080).
 *
 * Composes: capability card, sample image OCR card, OCR result card, and setup guide.
 * The native bridge is exercised through the useLiveText hook.
 */

import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import OCRResultCard from './components/OCRResultCard';
import SampleImageCard from './components/SampleImageCard';
import SetupGuide from './components/SetupGuide';
import { useLiveText } from './hooks/useLiveText';

export default function LiveTextLabScreen() {
  const store = useLiveText();
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
        <SampleImageCard
          style={styles.card}
          loading={store.loading}
          onRecognize={(base64) => {
            void store.recognizeText(base64);
          }}
        />
        <OCRResultCard style={styles.card} result={store.lastResult} />
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
