/**
 * ParticipantsList — SharePlay Lab (feature 047).
 *
 * Lists active participants with display names where available.
 * Pure presentational.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Participant } from '@/native/shareplay.types';

interface ParticipantsListProps {
  readonly style?: ViewStyle;
  readonly participants: readonly Participant[];
}

export default function ParticipantsList({ style, participants }: ParticipantsListProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="shareplay-participants-list"
    >
      <ThemedText type="smallBold">Participants ({participants.length})</ThemedText>
      {participants.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="shareplay-participants-empty">
          No participants yet. Start a FaceTime call and tap the activity in the SharePlay menu.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {participants.map((p) => (
            <ThemedText key={p.id} type="small" testID={`shareplay-participant-${p.id}`}>
              👤 {p.displayName ?? p.id}
            </ThemedText>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  list: {
    gap: Spacing.one,
  },
});
