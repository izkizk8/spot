/**
 * ShieldingCard — Apply / Clear shielding buttons (FR-007).
 *
 * Both buttons are disabled when `selectionSummary === null`.
 * The Apply button passes the persisted token to `bridge.applyShielding()`.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/screentime';
import type { SelectionSummary } from '@/native/screentime.types';

export interface ShieldingCardProps {
  readonly selectionSummary: SelectionSummary | null;
  readonly shieldingActive: boolean;
  readonly onApplied: () => void;
  readonly onCleared: () => void;
  readonly onError: (message: string) => void;
  readonly disabled?: boolean;
}

export function ShieldingCard({
  selectionSummary,
  shieldingActive,
  onApplied,
  onCleared,
  onError,
  disabled = false,
}: ShieldingCardProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const buttonsDisabled = disabled || selectionSummary === null;

  const handleApply = async (): Promise<void> => {
    if (busy || buttonsDisabled || selectionSummary === null) return;
    setBusy(true);
    try {
      await bridge.applyShielding(selectionSummary.rawSelectionToken);
      setStatus('Shielding applied.');
      onApplied();
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

  const handleClear = async (): Promise<void> => {
    if (busy || buttonsDisabled) return;
    setBusy(true);
    try {
      await bridge.clearShielding();
      setStatus('Shielding cleared.');
      onCleared();
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

  return (
    <ThemedView accessibilityLabel='Shielding card' style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Shielding</ThemedText>
        <ThemedView accessibilityLabel='Shielding status pill' style={styles.pill}>
          <ThemedText style={styles.pillText}>{shieldingActive ? 'Active' : 'Inactive'}</ThemedText>
        </ThemedView>
      </ThemedView>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Apply Shielding'
        accessibilityState={{ disabled: buttonsDisabled }}
        disabled={buttonsDisabled}
        onPress={handleApply}
        style={[styles.button, buttonsDisabled && styles.buttonDisabled]}
      >
        <ThemedText style={styles.buttonText}>Apply Shielding</ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Clear Shielding'
        accessibilityState={{ disabled: buttonsDisabled }}
        disabled={buttonsDisabled}
        onPress={handleClear}
        style={[styles.secondaryButton, buttonsDisabled && styles.buttonDisabled]}
      >
        <ThemedText style={styles.secondaryButtonText}>Clear Shielding</ThemedText>
      </Pressable>
      {status != null && (
        <ThemedText accessibilityLabel='Shielding status text' style={styles.status}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  pill: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: '#E0E1E6',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
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
