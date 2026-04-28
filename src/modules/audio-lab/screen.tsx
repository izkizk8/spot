/**
 * Audio Lab — placeholder screen (Phase 2 foundational).
 *
 * Real screen variants (iOS / Android / Web) are implemented in later
 * phases (US1 / US2 / US3 / US4). This placeholder exists so the manifest
 * `render()` returns a real React node and the module appears in the grid
 * during the foundational checkpoint.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function AudioLabScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Audio Lab</ThemedText>
      <ThemedText style={styles.body}>
        Recording, playback, quality presets, and audio-session controls.
      </ThemedText>
      <ThemedText style={styles.body}>
        Implementation in progress — see specs/020-audio-recording for status.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  body: {
    marginTop: Spacing.two,
  },
});
