/**
 * HealthKit Lab — iOS screen — feature 043.
 *
 * Composes the six HealthKit cards on top of the `useHealthKit` hook.
 * The hook owns native interactions; this component only orchestrates
 * which card is mounted and wires the hook callbacks to each card's
 * action handler.
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AuthorizationCard from './components/AuthorizationCard';
import HeartRateCard from './components/HeartRateCard';
import LiveUpdatesCard from './components/LiveUpdatesCard';
import SleepCard from './components/SleepCard';
import StepCountCard from './components/StepCountCard';
import WorkoutCard from './components/WorkoutCard';
import { useHealthKit } from './hooks/useHealthKit';

export default function HealthKitLabScreen() {
  const hk = useHealthKit();

  const handleManualHeartRate = useCallback(
    (bpm: number) => {
      void hk.writeManualHeartRate(bpm);
    },
    [hk],
  );

  const handleToggleObserver = useCallback(() => {
    hk.toggleObserver();
  }, [hk]);

  const handleRequest = useCallback(() => {
    void hk.init();
  }, [hk]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AuthorizationCard
          style={styles.card}
          authStatusByType={hk.authStatusByType}
          initialised={hk.initialised}
          available={hk.available}
          onRequest={handleRequest}
        />
        <StepCountCard style={styles.card} steps7d={hk.steps7d} />
        <HeartRateCard
          style={styles.card}
          samples={hk.heartRate24h}
          latest={hk.latestHeartRate}
          onAddManualReading={handleManualHeartRate}
        />
        <SleepCard style={styles.card} segments={hk.sleepLastNight} />
        <WorkoutCard style={styles.card} workouts={hk.workouts} />
        <LiveUpdatesCard
          style={styles.card}
          observerActive={hk.observerActive}
          observerUpdateCount={hk.observerUpdateCount}
          onToggle={handleToggleObserver}
        />
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
