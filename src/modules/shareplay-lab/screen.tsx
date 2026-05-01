/**
 * SharePlay Lab — iOS screen (feature 047).
 *
 * Composes the showcase sections: CapabilityCard, ActivityComposer,
 * SessionStatusCard, ParticipantsList, CounterActivity (when the
 * picked type is `counter`), SetupInstructions. The native bridge
 * is exercised through the `useGroupActivity` hook.
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { hasLivePayload } from './activity-types';
import ActivityComposer from './components/ActivityComposer';
import CapabilityCard from './components/CapabilityCard';
import CounterActivity from './components/CounterActivity';
import ParticipantsList from './components/ParticipantsList';
import SessionStatusCard from './components/SessionStatusCard';
import SetupInstructions from './components/SetupInstructions';
import { useGroupActivity } from './hooks/useGroupActivity';

export default function SharePlayLabScreen() {
  const g = useGroupActivity();

  const onStart = useCallback(() => {
    void g.startActivity();
  }, [g]);
  const onEnd = useCallback(() => {
    void g.endActivity();
  }, [g]);
  const onCounter = useCallback(
    (next: number) => {
      void g.sendCounter(next);
    },
    [g],
  );

  const showCounter = hasLivePayload(g.activityType);
  const counterDisabled = g.state.status !== 'active';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilityCard style={styles.card} available={g.available} status={g.state.status} />
        <ActivityComposer
          style={styles.card}
          selectedType={g.activityType}
          title={g.title}
          onSelectType={g.selectActivityType}
          onChangeTitle={g.setTitle}
        />
        <SessionStatusCard
          style={styles.card}
          status={g.state.status}
          loading={g.loading}
          onStart={onStart}
          onEnd={onEnd}
        />
        {g.lastError ? (
          <ThemedText type='small' themeColor='tintB' testID='shareplay-error'>
            {g.lastError}
          </ThemedText>
        ) : null}
        <ParticipantsList style={styles.card} participants={g.state.participants} />
        {showCounter ? (
          <CounterActivity
            style={styles.card}
            value={g.state.counter}
            onChange={onCounter}
            disabled={counterDisabled}
          />
        ) : null}
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
