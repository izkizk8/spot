/**
 * ImageContentPicker — feature 033 / T026.
 *
 * 2x2 grid of bundled sample images.
 */

import React from 'react';
import { Image, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { BUNDLED_IMAGES, type BundledImageEntry } from '../bundled-images';

interface ImageContentPickerProps {
  readonly selectedSource: number | null;
  readonly onSelect: (image: BundledImageEntry) => void;
  readonly style?: ViewStyle;
}

export default function ImageContentPicker({
  selectedSource,
  onSelect,
  style,
}: ImageContentPickerProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      {BUNDLED_IMAGES.map((image) => {
        const isSelected = selectedSource === image.source;
        return (
          <Pressable
            key={image.alt}
            accessibilityRole="button"
            accessibilityLabel={image.alt}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(image)}
            style={[styles.tile, isSelected && styles.tileSelected]}
          >
            <Image source={image.source} style={styles.image} />
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    width: 80,
    height: 80,
    borderRadius: Spacing.two,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  tileSelected: {
    borderColor: '#007AFF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
