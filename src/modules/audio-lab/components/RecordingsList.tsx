/**
 * RecordingsList — FlatList of saved recordings with empty-state copy
 * (US1, T037).
 *
 * Per data-model: rows are keyed by stable `Recording.id`. The actual
 * `RecordingRow` component lands in US2 (T040 / T041); for US1 we render a
 * minimal placeholder row that surfaces the name + duration so the list is
 * smoke-testable end-to-end.
 */

import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Recording } from '../audio-types';

export interface RecordingsListProps {
  recordings: ReadonlyArray<Recording>;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (recording: Recording) => void;
  /** Optional pruner invoked by the row when a file is detected missing. */
  onMissingFile?: (id: string) => void;
}

const EMPTY_COPY = 'No recordings yet — tap the record button to capture one.';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

interface RowProps {
  recording: Recording;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (recording: Recording) => void;
}

function Row({ recording, onPlay, onDelete, onShare }: RowProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.row} testID={`audio-lab-row-${recording.id}`}>
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{recording.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDuration(recording.durationMs)} · {recording.quality}
        </ThemedText>
      </View>
      <View style={styles.rowActions}>
        <Pressable
          onPress={() => onPlay(recording.id)}
          accessibilityRole="button"
          accessibilityLabel={`Play ${recording.name}`}
          style={styles.action}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            Play
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onShare(recording)}
          accessibilityRole="button"
          accessibilityLabel={`Share ${recording.name}`}
          style={styles.action}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            Share
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onDelete(recording.id)}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${recording.name}`}
          style={styles.action}
        >
          <ThemedText type="smallBold" themeColor="tintB">
            Delete
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

export default function RecordingsList({
  recordings,
  onPlay,
  onDelete,
  onShare,
}: RecordingsListProps) {
  if (recordings.length === 0) {
    return (
      <View style={styles.empty} testID="audio-lab-empty-state">
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
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
        <Row recording={item} onPlay={onPlay} onDelete={onDelete} onShare={onShare} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      style={styles.list}
      testID="audio-lab-recordings-list"
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
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
});
