/**
 * Quick Actions Lab Screen (iOS)
 * Feature: 039-quick-actions
 */

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ExplainerCard } from './components/ExplainerCard';
import { StaticActionsList } from './components/StaticActionsList';
import { DynamicActionsManager } from './components/DynamicActionsManager';
import { LastInvokedCard } from './components/LastInvokedCard';
import { useQuickActions } from './hooks/useQuickActions';

export default function QuickActionsLabScreen() {
  const qa = useQuickActions();

  const handleReset = () => {
    Alert.alert('Clear all dynamic actions?', 'Static defaults will remain.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          void qa.clearItems();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ExplainerCard />
        <StaticActionsList />
        <DynamicActionsManager />
        <LastInvokedCard event={qa.lastInvoked} />
        <Pressable onPress={handleReset} style={styles.resetButton} testID="reset-button">
          <ThemedText type="default" themeColor="tintB">
            Reset dynamic actions
          </ThemedText>
        </Pressable>
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
  resetButton: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
});
