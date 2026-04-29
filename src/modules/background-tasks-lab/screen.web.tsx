/**
 * Background Tasks Lab Screen — Web variant — feature 030.
 *
 * Identical to the Android fallback. MUST NOT import
 * `@/native/background-tasks` (only `.types` is permitted, and only
 * indirectly via the cross-platform-safe components).
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import ExplainerCard from './components/ExplainerCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import TestTriggerCard from './components/TestTriggerCard';

export default function BackgroundTasksLabScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <IOSOnlyBanner style={styles.card} />
      <ExplainerCard style={styles.card} />
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
