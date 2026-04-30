/**
 * App Clips Lab — iOS screen — feature 042.
 *
 * Composes ExplainerCard, InvocationSimulator, PayloadViewer,
 * SetupInstructions, and LimitationsCard. Subscribes to the shared
 * simulator-store for the payload feed.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import ExplainerCard from './components/ExplainerCard';
import InvocationSimulator from './components/InvocationSimulator';
import LimitationsCard from './components/LimitationsCard';
import PayloadViewer from './components/PayloadViewer';
import SetupInstructions from './components/SetupInstructions';
import { simulatorStore, type SimulatedInvocation } from './simulator-store';

export default function AppClipsLabScreen() {
  const [invocations, setInvocations] = useState<readonly SimulatedInvocation[]>(() =>
    simulatorStore.list(),
  );

  useEffect(() => {
    const unsubscribe = simulatorStore.subscribe(() => {
      setInvocations(simulatorStore.list());
    });
    return unsubscribe;
  }, []);

  const handleSimulate = useCallback((input: Parameters<typeof simulatorStore.push>[0]) => {
    simulatorStore.push(input);
  }, []);

  const handleClear = useCallback(() => {
    simulatorStore.clear();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ExplainerCard style={styles.card} />
        <InvocationSimulator style={styles.card} onSimulate={handleSimulate} />
        <PayloadViewer style={styles.card} invocations={invocations} onClear={handleClear} />
        <SetupInstructions style={styles.card} />
        <LimitationsCard style={styles.card} />
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
    overflow: 'hidden',
  },
});
