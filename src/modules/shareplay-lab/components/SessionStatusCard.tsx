/**
 * SessionStatusCard — SharePlay Lab (feature 047).
 *
 * Renders the session status pill plus the Start / End controls.
 * Pure presentational + controlled.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SessionStatus } from '@/native/shareplay.types';

interface SessionStatusCardProps {
  readonly style?: ViewStyle;
  readonly status: SessionStatus;
  readonly loading: boolean;
  readonly onStart: () => void;
  readonly onEnd: () => void;
}

export function statusGlyph(s: SessionStatus): string {
  switch (s) {
    case 'active':
      return '🟢';
    case 'preparing':
      return '🟡';
    case 'ended':
      return '⚪';
    case 'none':
    default:
      return '⚫';
  }
}

export default function SessionStatusCard({
  style,
  status,
  loading,
  onStart,
  onEnd,
}: SessionStatusCardProps) {
  const isActive = status === 'active' || status === 'preparing';
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="shareplay-session-status-card"
    >
      <ThemedText type="smallBold">Session status</ThemedText>
      <ThemedText type="default" testID="shareplay-status-pill">
        {statusGlyph(status)} {status}
      </ThemedText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          onPress={onStart}
          disabled={loading}
          testID="shareplay-start-button"
          style={[styles.button, styles.start]}
        >
          <ThemedText type="smallBold">{loading ? 'Starting…' : 'Start activity'}</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !isActive || loading }}
          onPress={onEnd}
          disabled={!isActive || loading}
          testID="shareplay-end-button"
          style={[styles.button, styles.end, (!isActive || loading) && styles.disabled]}
        >
          <ThemedText type="smallBold">End</ThemedText>
        </Pressable>
      </View>
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
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  start: {
    backgroundColor: 'rgba(80,180,120,0.18)',
  },
  end: {
    backgroundColor: 'rgba(220,80,80,0.18)',
  },
  disabled: {
    opacity: 0.4,
  },
});
