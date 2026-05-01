/**
 * CredentialStateCard — Displays credential state with Refresh button.
 *
 * Four states: authorized, revoked, notFound, transferred.
 * Refresh button is disabled when no user exists.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { CredentialState } from '../hooks/useSiwaSession';

interface CredentialStateCardProps {
  state: CredentialState | null;
  hasUser: boolean;
  onRefresh: () => void;
}

function getLabelForState(state: CredentialState | null): string {
  if (state === null) return 'Unknown';
  switch (state) {
    case 'authorized':
      return 'Authorized ✓';
    case 'revoked':
      return 'Revoked ⚠️';
    case 'notFound':
      return 'Not Found';
    case 'transferred':
      return 'Transferred';
    default:
      return 'Unknown';
  }
}

export default function CredentialStateCard({
  state,
  hasUser,
  onRefresh,
}: CredentialStateCardProps) {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='siwa-credential-card'>
      <ThemedText type='subtitle' style={styles.title}>
        Credential State
      </ThemedText>

      <ThemedText type='default'>{getLabelForState(state)}</ThemedText>

      {!hasUser && (
        <ThemedText type='small' themeColor='textSecondary'>
          Sign in to check credential state
        </ThemedText>
      )}

      <Pressable
        style={[styles.button, !hasUser && styles.buttonDisabled]}
        onPress={onRefresh}
        disabled={!hasUser}
        testID='siwa-credential-refresh'
      >
        <ThemedText type='default' themeColor={hasUser ? 'tintA' : 'textSecondary'}>
          Refresh
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  button: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
