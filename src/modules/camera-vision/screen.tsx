/**
 * Camera Vision screen — iOS implementation (placeholder for Phase 2 Foundational).
 *
 * This placeholder satisfies the manifest import. Full implementation in Phase 3 (US1).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function CameraVisionScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Camera Vision
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Implementation in progress (Phase 3)
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.two,
  },
});
