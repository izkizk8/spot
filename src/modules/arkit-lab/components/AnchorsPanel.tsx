/**
 * AnchorsPanel Component
 * Feature: 034-arkit-basics
 *
 * Scrollable list of placed anchors. Each row shows short ID (first 8 chars)
 * and position (x, y, z) rounded to 2 decimals. Slices to 100 newest-first.
 */

import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { AnchorRecord } from '@/native/arkit.types';

interface AnchorsPanelProps {
  readonly anchors: readonly AnchorRecord[];
}

export default function AnchorsPanel({ anchors }: AnchorsPanelProps) {
  // Slice to 100 newest-first at render boundary (no virtualization)
  const displayAnchors = anchors.slice(0, 100);

  if (anchors.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.emptyText}>No anchors placed yet</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Anchors ({anchors.length})</ThemedText>
        {anchors.length >= 100 && (
          <ThemedText style={styles.caption}>Soft cap: showing 100 newest-first</ThemedText>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {displayAnchors.map((anchor) => (
          <View key={anchor.id} style={styles.row}>
            <ThemedText style={styles.idText}>{anchor.id.substring(0, 8)}</ThemedText>
            <ThemedText style={styles.coordsText}>
              ({anchor.x.toFixed(2)}, {anchor.y.toFixed(2)}, {anchor.z.toFixed(2)})
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    maxHeight: 200,
  },
  header: {
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: Spacing.one,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  idText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  coordsText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
