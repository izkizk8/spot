/**
 * Spotlight Lab Screen — Android variant.
 * feature 031 / T043.
 *
 * Shows IOSOnlyBanner + ExplainerCard + PersistenceNoteCard only.
 * Does NOT import the iOS bridge.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import ExplainerCard from './components/ExplainerCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import PersistenceNoteCard from './components/PersistenceNoteCard';

export default function SpotlightLabScreenAndroid() {
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
