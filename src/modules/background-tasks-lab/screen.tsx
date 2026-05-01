/**
 * Background Tasks Lab Screen — iOS variant — feature 030.
 *
 * Five-panel flow on iOS 13+ when the native module is loadable;
 * fallback (banner + explainer + test triggers) otherwise.
 */

import React, { useCallback } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import * as bridge from '@/native/background-tasks';

import ExplainerCard from './components/ExplainerCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import RunHistoryList from './components/RunHistoryList';
import ScheduleAppRefreshCard from './components/ScheduleAppRefreshCard';
import ScheduleProcessingCard from './components/ScheduleProcessingCard';
import TestTriggerCard from './components/TestTriggerCard';
import { clearRuns } from './history-store';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';

function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version;
  return typeof v === 'string' ? parseFloat(v) : v;
}

export default function BackgroundTasksLabScreen() {
  const { schedule, history, error, lastRunByType, scheduledByType, refresh } =
    useBackgroundTasks();

  const onScheduleRefresh = useCallback(() => schedule('refresh'), [schedule]);
  const onScheduleProcessing = useCallback(() => schedule('processing'), [schedule]);
  const onClearHistory = useCallback(() => {
    void clearRuns().then(() => refresh());
  }, [refresh]);

  const available = bridge.isAvailable();
  const iOSTooOld = Platform.OS === 'ios' && getIOSVersion() < 13;

  if (!available) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <IOSOnlyBanner style={styles.card} reason={iOSTooOld ? 'older-ios' : 'platform'} />
        <ExplainerCard style={styles.card} />
        <TestTriggerCard style={styles.card} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ExplainerCard style={styles.card} />
      <ScheduleAppRefreshCard
        style={styles.card}
        status={scheduledByType.refresh}
        lastRun={lastRunByType.refresh}
        onSchedule={onScheduleRefresh}
      />
      <ScheduleProcessingCard
        style={styles.card}
        status={scheduledByType.processing}
        lastRun={lastRunByType.processing}
        onSchedule={onScheduleProcessing}
      />
      <RunHistoryList
        style={styles.card}
        history={history}
        error={error}
        onClear={onClearHistory}
      />
      <TestTriggerCard style={styles.card} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
  },
});
