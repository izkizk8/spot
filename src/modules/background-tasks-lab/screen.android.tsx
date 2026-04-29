/**
 * Background Tasks Lab Screen — Android variant — feature 030.
 *
 * Cross-platform fallback: banner + explainer + test-trigger only.
 * Imports only the cross-platform-safe components (no bridge mutating
 * methods are invoked).
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
