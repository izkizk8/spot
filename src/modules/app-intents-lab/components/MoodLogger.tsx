/**
 * MoodLogger — themed three-segment mood picker + Log mood button.
 *
 * Pure presentational component. Parent owns the value and the
 * onLog handler.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MOODS, type Mood } from '@/modules/app-intents-lab/mood-store';

export interface MoodLoggerProps {
  readonly value: Mood;
  readonly onChange: (next: Mood) => void;
  readonly onLog: () => void;
  readonly logLabel?: string;
}

const MOOD_LABELS: Readonly<Record<Mood, string>> = {
  happy: 'Happy',
  neutral: 'Neutral',
  sad: 'Sad',
};

export function MoodLogger({ value, onChange, onLog, logLabel }: MoodLoggerProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.row}>
        {MOODS.map((m) => {
          const selected = m === value;
          const label = MOOD_LABELS[m];
          return (
            <Pressable
              key={m}
              accessibilityRole='button'
              accessibilityLabel={`Mood: ${label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(m)}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <ThemedText style={styles.segmentText}>{label}</ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={logLabel ?? 'Log mood'}
        onPress={onLog}
        style={styles.logButton}
      >
        <ThemedText style={styles.logButtonText}>{logLabel ?? 'Log mood'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  segmentSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  segmentText: {
    fontSize: 14,
  },
  logButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
