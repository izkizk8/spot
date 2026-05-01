/**
 * ActivityComposer — SharePlay Lab (feature 047).
 *
 * Three-way activity-type selector plus a free-form title input.
 * Pure presentational + controlled.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ActivityType } from '@/native/shareplay.types';

import { ACTIVITY_TYPES } from '../activity-types';

interface ActivityComposerProps {
  readonly style?: ViewStyle;
  readonly selectedType: ActivityType;
  readonly title: string;
  readonly onSelectType: (t: ActivityType) => void;
  readonly onChangeTitle: (t: string) => void;
}

export default function ActivityComposer({
  style,
  selectedType,
  title,
  onSelectType,
  onChangeTitle,
}: ActivityComposerProps) {
  const handle = useCallback((t: ActivityType) => () => onSelectType(t), [onSelectType]);

  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='shareplay-activity-composer'
    >
      <ThemedText type='smallBold'>Activity</ThemedText>
      <View style={styles.row}>
        {ACTIVITY_TYPES.map((o) => {
          const isSelected = o.id === selectedType;
          return (
            <Pressable
              key={o.id}
              onPress={handle(o.id)}
              accessibilityRole='button'
              accessibilityState={{ selected: isSelected }}
              testID={`shareplay-activity-${o.id}`}
              style={[styles.button, isSelected && styles.buttonSelected]}
            >
              <ThemedText type={isSelected ? 'smallBold' : 'small'}>{o.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      <ThemedText type='small' themeColor='textSecondary'>
        {ACTIVITY_TYPES.find((t) => t.id === selectedType)?.description ?? ''}
      </ThemedText>
      <ThemedText type='smallBold'>Title</ThemedText>
      <TextInput
        accessibilityLabel='Activity title'
        testID='shareplay-activity-title'
        value={title}
        onChangeText={onChangeTitle}
        style={styles.input}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  buttonSelected: {
    backgroundColor: 'rgba(120,120,255,0.15)',
  },
  input: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.one,
    minHeight: 36,
  },
});
