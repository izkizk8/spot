/**
 * Spotlight Lab Screen — Web variant.
 * feature 031 / T044.
 *
 * Shows IOSOnlyBanner + ExplainerCard + PersistenceNoteCard only.
 * MUST NOT import src/native/spotlight at module evaluation time.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import ExplainerCard from './components/ExplainerCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import PersistenceNoteCard from './components/PersistenceNoteCard';

export default function SpotlightLabScreenWeb() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <IOSOnlyBanner />
      <ExplainerCard style={styles.card} />
      <PersistenceNoteCard style={styles.card} />
    </ScrollView>
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
