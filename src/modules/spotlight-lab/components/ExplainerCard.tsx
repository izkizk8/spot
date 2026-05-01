/**
 * ExplainerCard — feature 031 / T028.
 *
 * Renders the CSSearchableIndex / NSUserActivity explainer
 * plus the home-screen test recipe.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ExplainerCardProps {
  readonly style?: ViewStyle;
}

export default function ExplainerCard({ style }: ExplainerCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>About Spotlight Indexing</ThemedText>
      <ThemedText style={styles.body}>
        iOS exposes two APIs for Spotlight search: CSSearchableIndex for persistent item indexing
        (iOS 9+) and NSUserActivity for current-state indexing (iOS 8+). Indexed content appears in
        system Spotlight when users swipe down on home and search.
      </ThemedText>
      <ThemedText style={styles.recipe}>
        Test it: swipe down on home → search "spot showcase" → tap any result to deep-link back.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: Spacing.two,
  },
  recipe: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
