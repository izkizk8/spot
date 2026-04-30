/**
 * Handoff & Continuity Lab — iOS screen — feature 040 / T037.
 *
 * Composes ExplainerCard, ActivityComposer, CurrentActivityCard,
 * IncomingLog, and SetupInstructions; wires `CurrentActivityCard.onResign`
 * to `useHandoffActivity().resignCurrent`.
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import ActivityComposer from './components/ActivityComposer';
import CurrentActivityCard from './components/CurrentActivityCard';
import ExplainerCard from './components/ExplainerCard';
import IncomingLog from './components/IncomingLog';
import SetupInstructions from './components/SetupInstructions';
import { useHandoffActivity } from './hooks/useHandoffActivity';

export default function HandoffLabScreen() {
  const { currentActivity, log, resignCurrent } = useHandoffActivity();

  const handleResign = useCallback(() => {
    void resignCurrent().catch(() => {
      // Errors surface via the hook; screen ignores them.
    });
  }, [resignCurrent]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ExplainerCard style={styles.card} />
        <ActivityComposer style={styles.card} />
        <CurrentActivityCard
          style={styles.card}
          currentActivity={currentActivity}
          onResign={handleResign}
        />
        <IncomingLog style={styles.card} events={log} />
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
    overflow: 'hidden',
  },
});
