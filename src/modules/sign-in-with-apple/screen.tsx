/**
 * Sign in with Apple — iOS screen (feature 021).
 *
 * Composes: UserCard, ScopesPicker, SiwaButton, Sign Out button, CredentialStateCard.
 * Uses useSiwaSession to drive the entire flow.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { useSiwaSession, type UseSiwaSessionOptions } from './hooks/useSiwaSession';
import UserCard from './components/UserCard';
import ScopesPicker from './components/ScopesPicker';
import SiwaButton from './components/SiwaButton';
import CredentialStateCard from './components/CredentialStateCard';

interface SignInWithAppleScreenProps {
  overrides?: UseSiwaSessionOptions;
}

export default function SignInWithAppleScreen({ overrides }: SignInWithAppleScreenProps = {}) {
  const session = useSiwaSession(overrides);

  const [scopes, setScopes] = React.useState({ email: true, fullName: true });
  const [variant, setVariant] = React.useState<'default' | 'continue' | 'signUp'>('default');
  const [style, setStyle] = React.useState<'black' | 'white' | 'whiteOutline'>('black');
  const [corner, setCorner] = React.useState<'square' | 'round' | 'pill'>('round');

  const handleSignIn = React.useCallback(() => {
    session.signIn(scopes);
  }, [session, scopes]);

  const handleSignOut = React.useCallback(() => {
    session.signOut();
  }, [session]);

  const handleRefreshCredential = React.useCallback(() => {
    session.refreshCredentialState();
  }, [session]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <UserCard state={session.state} user={session.user} error={session.error} />

        <ScopesPicker
          value={scopes}
          onChange={setScopes}
          disabled={session.state === 'loading' || session.state === 'signed-in'}
        />

        <SiwaButton
          variant={variant}
          style={style}
          corner={corner}
          onPress={handleSignIn}
          disabled={session.state === 'loading' || session.state === 'signed-in'}
          onVariantChange={setVariant}
          onStyleChange={setStyle}
          onCornerChange={setCorner}
        />

        {session.state === 'signed-in' && (
          <Pressable style={styles.signOutButton} onPress={handleSignOut} testID="siwa-sign-out">
            <ThemedText type="default" themeColor="tintB">
              Sign Out
            </ThemedText>
          </Pressable>
        )}

        <CredentialStateCard
          state={session.credentialState}
          hasUser={session.user !== null}
          onRefresh={handleRefreshCredential}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  signOutButton: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
});
