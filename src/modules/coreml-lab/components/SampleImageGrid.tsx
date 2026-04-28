/**
 * Sample Image Grid component for CoreML Lab (feature 016).
 *
 * Displays a grid of bundled sample PNG thumbnails. Tapping a sample
 * invokes the onSelect callback with the selected sample.
 */

import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const SAMPLE_IMAGES = [
  { id: 'red', source: require('../samples/sample-red.png') },
  { id: 'green', source: require('../samples/sample-green.png') },
  { id: 'blue', source: require('../samples/sample-blue.png') },
  { id: 'yellow', source: require('../samples/sample-yellow.png') },
];

export interface SampleImageGridProps {
  selectedId: string | null;
  onSelect: (id: string, source: number) => void;
}

export function SampleImageGrid({ selectedId, onSelect }: SampleImageGridProps) {
  return (
    <ThemedView style={styles.container}>
      {SAMPLE_IMAGES.map((sample) => (
        <Pressable
          key={sample.id}
          style={[styles.thumbnail, sample.id === selectedId && styles.thumbnailSelected]}
          onPress={() => onSelect(sample.id, sample.source)}
        >
          <Image source={sample.source} style={styles.image} />
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: Spacing.one,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: '#007AFF',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: Spacing.one,
  },
});
