/**
 * Shortcuts Snippets Lab — iOS screen (feature 072).
 */

import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupGuide from './components/SetupGuide';
import ShortcutPanel from './components/ShortcutPanel';
import ShortcutsInfoCard from './components/ShortcutsInfoCard';
import SnippetPreviewCard from './components/SnippetPreviewCard';
import { useShortcutsSnippets } from './hooks/useShortcutsSnippets';

export default function ShortcutsSnippetsLabScreen() {
  const store = useShortcutsSnippets();
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
        <ShortcutsInfoCard style={styles.card} info={store.info} />
        <ShortcutPanel
          style={styles.card}
          shortcuts={store.shortcuts}
          onSimulateSnippet={(id, type) => {
            void store.simulateSnippet(id, type);
          }}
          onAddVoiceShortcut={(id) => {
            void store.addVoiceShortcut(id);
          }}
          loading={store.loading}
        />
        <SnippetPreviewCard style={styles.card} snippet={store.activeSnippet} />
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
