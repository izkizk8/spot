/**
 * PhotoGrid Component
 * Feature: 057-photokit
 *
 * Renders a scrollable grid of picked photo assets showing their
 * filename and dimensions.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { PhotoAsset } from '@/native/photokit.types';

interface PhotoGridProps {
  assets: readonly PhotoAsset[];
  style?: ViewStyle;
}

function PhotoRow({ asset }: { asset: PhotoAsset }) {
  const mediaIcon = asset.mediaType === 'video' ? '🎬' : '🖼️';
  const date = asset.creationDate ? new Date(asset.creationDate).toLocaleDateString() : '—';
  return (
    <ThemedView style={styles.row}>
      <ThemedText style={styles.icon}>{mediaIcon}</ThemedText>
      <ThemedView style={styles.rowInfo}>
        <ThemedText style={styles.filename} numberOfLines={1}>
          {asset.filename}
        </ThemedText>
        <ThemedText style={styles.meta}>
          {asset.width}×{asset.height} · {date}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export default function PhotoGrid({ assets, style }: PhotoGridProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Selected Photos ({assets.length})</ThemedText>
      {assets.length === 0 ? (
        <ThemedText style={styles.empty}>No photos selected yet.</ThemedText>
      ) : (
        assets.map((asset) => <PhotoRow key={asset.id} asset={asset} />)
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  empty: {
    fontSize: 14,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  icon: {
    fontSize: 28,
  },
  rowInfo: {
    flex: 1,
  },
  filename: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    opacity: 0.7,
  },
});
