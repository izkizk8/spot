/**
 * RecordingsList — FlatList of saved recordings with empty-state copy
 * (US1 T037 + US2 T044).
 *
 * Per data-model: rows are keyed by stable `Recording.id` and rendered with
 * the dedicated `RecordingRow` component (US2 / T043).
 */

import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import type { Recording } from '../audio-types';

import RecordingRow from './RecordingRow';

export interface RecordingsListProps {
  recordings: ReadonlyArray<Recording>;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (recording: Recording) => void;
  /** Optional pruner invoked by the row when a file is detected missing. */
  onMissingFile?: (id: string) => void;
}

const EMPTY_COPY = 'No recordings yet — tap the record button to capture one.';

export default function RecordingsList({
  recordings,
  onPlay,
  onDelete,
  onShare,
}: RecordingsListProps) {
  if (recordings.length === 0) {
    return (
      <View style={styles.empty} testID='audio-lab-empty-state'>
        <ThemedText type='small' themeColor='textSecondary' style={styles.emptyText}>
          {EMPTY_COPY}
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={recordings as Recording[]}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => (
        <RecordingRow recording={item} onPlay={onPlay} onDelete={onDelete} onShare={onShare} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      style={styles.list}
      testID='audio-lab-recordings-list'
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
  },
  empty: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  separator: {
    height: Spacing.two,
  },
});
