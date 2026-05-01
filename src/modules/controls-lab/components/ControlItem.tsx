/**
 * ControlItem Component
 * Feature: 087-controls
 *
 * Renders a single registered control descriptor with a trigger button.
 */
import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ControlActionResult, ControlInfo } from '@/native/controls.types';

interface ControlItemProps {
  control: ControlInfo;
  loading: boolean;
  lastResult: ControlActionResult | null;
  onTrigger(): void;
  style?: ViewStyle;
}

export default function ControlItem({
  control,
  loading,
  lastResult,
  onTrigger,
  style,
}: ControlItemProps) {
  const isLastResult = lastResult?.controlId === control.id;

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>{control.title}</ThemedText>
      <ThemedText style={styles.meta}>
        Kind: {control.kind} · SF Symbol: {control.systemImageName}
      </ThemedText>
      {control.kind === 'toggle' && control.isOn !== null && (
        <ThemedText style={styles.meta}>State: {control.isOn ? 'On' : 'Off'}</ThemedText>
      )}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onTrigger}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={`Trigger ${control.title}`}
      >
        <ThemedText style={styles.buttonLabel}>{loading ? 'Triggering…' : 'Trigger'}</ThemedText>
      </Pressable>
      {isLastResult && lastResult && (
        <ThemedText style={styles.result}>
          {lastResult.success ? '✅ Triggered' : '❌ Failed'} at {lastResult.triggeredAt}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: Spacing.two,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  result: {
    fontSize: 13,
    opacity: 0.8,
  },
});
