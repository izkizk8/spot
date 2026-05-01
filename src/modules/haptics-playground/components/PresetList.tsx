import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Preset } from '../types';

export interface PresetListProps {
  readonly presets: readonly Preset[];
  readonly onPlay: (preset: Preset) => void;
  readonly onDelete: (id: string) => void;
}

export function PresetList({ presets, onPlay, onDelete }: PresetListProps) {
  if (presets.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText type='small' themeColor='textSecondary'>
          No presets yet — compose a pattern and tap Save Preset.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      {presets.map((p) => (
        <View key={p.id} style={styles.row}>
          <Pressable onPress={() => onPlay(p)} style={styles.name} accessibilityRole='button'>
            <ThemedText type='smallBold'>{p.name}</ThemedText>
          </Pressable>
          <Pressable
            testID={`delete-${p.id}`}
            onPress={() => onDelete(p.id)}
            style={styles.delete}
            accessibilityRole='button'
            accessibilityLabel={`Delete ${p.name}`}
          >
            <ThemedText type='small'>✕</ThemedText>
          </Pressable>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  empty: {
    paddingVertical: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(127,127,127,0.4)',
  },
  name: {
    flex: 1,
  },
  delete: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
