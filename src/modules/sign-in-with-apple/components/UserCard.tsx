/**
 * UserCard — Sign in with Apple user state card.
 *
 * Renders four states: signed-out, signed-in, loading, error.
 * Shows user.id, user.email (if present), user.givenName + familyName (if present).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { StoredUser } from '../siwa-store';
import type { SiwaState } from '../hooks/useSiwaSession';

interface UserCardProps {
  state: SiwaState;
  user: StoredUser | null;
  error: string | null;
}

export default function UserCard({ state, user, error }: UserCardProps) {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="siwa-user-card">
      <ThemedText type="subtitle" style={styles.title}>
        User Status
      </ThemedText>
      <ThemedText type="default" testID="siwa-user-card-state">
        State: {state}
      </ThemedText>

      {state === 'signed-in' && user && (
        <View style={styles.userInfo}>
          <ThemedText type="small">User ID: {user.id}</ThemedText>
          {user.email && <ThemedText type="small">Email: {user.email}</ThemedText>}
          {user.givenName && user.familyName && (
            <ThemedText type="small">
              Name: {user.givenName} {user.familyName}
            </ThemedText>
          )}
          {user.credentialState && (
            <ThemedText type="small" themeColor="textSecondary">
              Credential: {user.credentialState}
            </ThemedText>
          )}
        </View>
      )}

      {state === 'loading' && (
        <ThemedText type="small" themeColor="textSecondary">
          Signing in...
        </ThemedText>
      )}

      {state === 'error' && error && (
        <ThemedText type="small" themeColor="tintB">
          Error: {error}
        </ThemedText>
      )}

      {state === 'signed-out' && (
        <ThemedText type="small" themeColor="textSecondary">
          Not signed in
        </ThemedText>
      )}
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
  userInfo: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
});
