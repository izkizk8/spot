/**
 * TestTriggerCard — feature 030 / T030.
 *
 * Surfaces the lldb commands to launch each task identifier on the
 * Simulator. The exact strings are an internal lldb convention; the
 * private-API caveat is rendered prominently (FR-051).
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  TASK_IDENTIFIER_PROCESSING,
  TASK_IDENTIFIER_REFRESH,
} from '@/native/background-tasks.types';

interface TestTriggerCardProps {
  readonly style?: ViewStyle;
}

const REFRESH_COMMAND = `e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"${TASK_IDENTIFIER_REFRESH}"]`;
const PROCESSING_COMMAND = `e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"${TASK_IDENTIFIER_PROCESSING}"]`;

export default function TestTriggerCard({ style }: TestTriggerCardProps) {
  const copyRefresh = useCallback(() => {
    void Clipboard.setStringAsync(REFRESH_COMMAND);
  }, []);
  const copyProcessing = useCallback(() => {
    void Clipboard.setStringAsync(PROCESSING_COMMAND);
  }, []);

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Test triggers (debugger only)</ThemedText>
      <ThemedText style={styles.caveat}>
        Uses Apple-private SPI (_simulateLaunchForTaskWithIdentifier:). Debug builds only — never
        ship a binary that calls this directly.
      </ThemedText>

      <ThemedText style={styles.label}>App refresh</ThemedText>
      <ThemedText style={styles.command} selectable>
        {REFRESH_COMMAND}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="copy refresh trigger command"
        onPress={copyRefresh}
        style={styles.copyButton}
      >
        <ThemedText style={styles.copyText}>Copy</ThemedText>
      </Pressable>

      <ThemedText style={styles.label}>Processing</ThemedText>
      <ThemedText style={styles.command} selectable>
        {PROCESSING_COMMAND}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="copy processing trigger command"
        onPress={copyProcessing}
        style={styles.copyButton}
      >
        <ThemedText style={styles.copyText}>Copy</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  caveat: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  command: {
    fontSize: 11,
    fontFamily: 'ui-monospace',
    backgroundColor: '#F0F0F3',
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  copyButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    backgroundColor: '#E0E1E6',
    borderRadius: Spacing.one,
  },
  copyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
