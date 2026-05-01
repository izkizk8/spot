/**
 * SiriKit Lab — iOS screen (feature 071).
 */

import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import IntentSimulator from './components/IntentSimulator';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupGuide from './components/SetupGuide';
import VocabularyPanel from './components/VocabularyPanel';
import { useSiriKit } from './hooks/useSiriKit';

export default function SiriKitLabScreen() {
  const store = useSiriKit();
  const { refresh } = store;

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
        <CapabilityCard style={styles.card} info={store.info} />
        <IntentSimulator
          style={styles.card}
          intents={store.intents}
          onSimulate={(domain, utterance) => {
            void store.simulateIntent(domain, utterance);
          }}
          onHandle={(id) => {
            void store.handleIntent(id);
          }}
          loading={store.loading}
        />
        <VocabularyPanel style={styles.card} vocabulary={store.vocabulary} />
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
