/**
 * Speech Recognition Lab — placeholder screen.
 *
 * The full iOS implementation lands in US1 (T041). This scaffold renders
 * a minimal themed surface so the manifest and dynamic imports resolve.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SpeechRecognitionLabScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Speech Recognition</ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.body}>
        Live transcription will be wired here in User Story 1.
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
