/**
 * ActivityPickerCard — "Pick apps & categories" + summary line + "Clear
 * selection" button (FR-006).
 *
 * Empty selection (selectionSummary === null) shows the placeholder copy.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/screentime';
import type { SelectionSummary } from '@/native/screentime.types';

export interface ActivityPickerCardProps {
  readonly selectionSummary: SelectionSummary | null;
  readonly onPicked: (summary: SelectionSummary) => void;
  readonly onCleared: () => void;
  readonly onError: (message: string) => void;
  readonly disabled?: boolean;
}

function summaryText(s: SelectionSummary | null): string {
  if (s === null) return 'No selection yet — tap "Pick apps & categories" to choose.';
  return `${s.applicationCount} apps / ${s.categoryCount} categories / ${s.webDomainCount} web domains`;
}

export function ActivityPickerCard({
  selectionSummary,
  onPicked,
  onCleared,
  onError,
  disabled = false,
}: ActivityPickerCardProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await bridge.pickActivity();
      setStatus(null);
      onPicked(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const surface = message.includes('entitlement')
        ? 'Entitlement required — see banner.'
        : message;
      setStatus(surface);
      onError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleClear = (): void => {
    setStatus(null);
    onCleared();
  };

  return (
    <ThemedView accessibilityLabel='Activity picker card' style={styles.container}>
      <ThemedText style={styles.title}>Activity Selection</ThemedText>
      <ThemedText accessibilityLabel='Activity selection summary' style={styles.summary}>
        {summaryText(selectionSummary)}
      </ThemedText>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Pick apps & categories'
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handlePick}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <ThemedText style={styles.buttonText}>Pick apps & categories</ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Clear selection'
        accessibilityState={{ disabled: disabled || selectionSummary === null }}
        disabled={disabled || selectionSummary === null}
        onPress={handleClear}
        style={[
          styles.secondaryButton,
          (disabled || selectionSummary === null) && styles.buttonDisabled,
        ]}
      >
        <ThemedText style={styles.secondaryButtonText}>Clear selection</ThemedText>
      </Pressable>
      {status != null && (
        <ThemedText accessibilityLabel='Activity status text' style={styles.status}>
          {status}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    fontSize: 13,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
