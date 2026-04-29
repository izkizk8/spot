/**
 * BundledSamplesCard — feature 032 / T033.
 *
 * 2x2 grid of bundled sample tiles. Each tap appends one row.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { resolveSampleUri, SAMPLES, type SampleDescriptor } from '../samples';
import type { DocumentEntry } from '../documents-store';

interface BundledSamplesCardProps {
  readonly onAdd: (entry: DocumentEntry) => void;
  readonly onError?: (err: Error) => void;
  readonly style?: ViewStyle;
}

let nextId = 0;
function makeId(sampleId: string): string {
  nextId += 1;
  return `sample-${sampleId}-${Date.now()}-${nextId}`;
}

export default function BundledSamplesCard({ onAdd, onError, style }: BundledSamplesCardProps) {
  const handleTap = useCallback(
    async (sample: SampleDescriptor) => {
      try {
        const uri = await resolveSampleUri(sample);
        const entry: DocumentEntry = {
          id: makeId(sample.id),
          name: sample.name,
          uri,
          mimeType: sample.mimeType,
          size: sample.size,
          addedAt: new Date().toISOString(),
          source: 'sample',
        };
        onAdd(entry);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [onAdd, onError],
  );

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Bundled samples</ThemedText>
      <ThemedView style={styles.grid}>
        {SAMPLES.map((sample) => (
          <Pressable
            key={sample.id}
            accessibilityRole="button"
            onPress={() => void handleTap(sample)}
            style={styles.tile}
          >
            <ThemedText style={styles.tileName}>{sample.name}</ThemedText>
            <ThemedText style={styles.tileMime}>{sample.mimeType}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    minWidth: '47%',
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.25)',
  },
  tileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  tileMime: {
    fontSize: 11,
    opacity: 0.7,
  },
});
