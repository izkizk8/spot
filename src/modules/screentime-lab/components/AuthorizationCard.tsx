/**
 * AuthorizationCard — status pill + "Request Authorization" button.
 *
 * On press, calls `bridge.requestAuthorization()`. On rejection
 * (`EntitlementMissingError`, etc.) the rejection is caught, the status
 * line surfaces "Entitlement required …" and the button stays enabled
 * (FR-005, FR-013, FR-023).
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/screentime';
import type { AuthorizationStatus } from '@/native/screentime.types';

export interface AuthorizationCardProps {
  readonly authStatus: AuthorizationStatus;
  readonly onAuthorized: (status: AuthorizationStatus) => void;
  readonly onError: (message: string) => void;
  /** Optional override; when omitted the iOS bridge is used directly. */
  readonly disabled?: boolean;
}

const STATUS_LABEL: Readonly<Record<AuthorizationStatus, string>> = {
  notDetermined: 'Not determined',
  approved: 'Approved',
  denied: 'Denied',
};

export function AuthorizationCard({
  authStatus,
  onAuthorized,
  onError,
  disabled = false,
}: AuthorizationCardProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handlePress = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await bridge.requestAuthorization();
      setStatus(`Authorization: ${STATUS_LABEL[next]}`);
      onAuthorized(next);
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
    <ThemedView accessibilityLabel='Authorization card' style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Authorization</ThemedText>
        <ThemedView accessibilityLabel='Authorization status pill' style={styles.pill}>
          <ThemedText style={styles.pillText}>{STATUS_LABEL[authStatus]}</ThemedText>
        </ThemedView>
      </ThemedView>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Request Authorization'
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handlePress}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <ThemedText style={styles.buttonText}>Request Authorization</ThemedText>
      </Pressable>
      {status != null && (
        <ThemedText accessibilityLabel='Authorization status text' style={styles.status}>
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
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
