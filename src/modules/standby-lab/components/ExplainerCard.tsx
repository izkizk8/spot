/**
 * ExplainerCard — narrative card explaining StandBy Mode and the 3 rendering modes.
 *
 * Pure presentational. Renders identically on every platform.
 *
 * @see specs/028-standby-mode/tasks.md T021, T028
 * @see specs/028-standby-mode/spec.md FR-SB-039
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface ExplainerCardProps {
  readonly style?: ViewStyle;
}

export function ExplainerCard({ style }: ExplainerCardProps = {}) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>About StandBy Mode</ThemedText>
      <ThemedText style={styles.body}>
        StandBy turns an iPhone on charge in landscape into a glanceable widget surface introduced
        in iOS 17. WidgetKit selects between three rendering modes — Full Color, Accented, and
        Vibrant — depending on system context. This module lets you push a StandBy widget and
        preview how each rendering mode treats your content.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
    gap: Spacing.two,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
});
