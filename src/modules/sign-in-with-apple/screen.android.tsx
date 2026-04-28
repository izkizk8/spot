/**
 * Sign in with Apple — Android screen (feature 021).
 *
 * Composes the same components as iOS but every interactive surface is disabled
 * and the IOSOnlyBanner is rendered across the top. Never instantiates
 * useSiwaSession and never invokes any bridge methods.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import IOSOnlyBanner from './components/IOSOnlyBanner';
import UserCard from './components/UserCard';
import ScopesPicker from './components/ScopesPicker';
import SiwaButton from './components/SiwaButton';
import CredentialStateCard from './components/CredentialStateCard';

const noop = () => {};

export default function SignInWithAppleScreen() {
  const [scopes] = React.useState({ email: true, fullName: true });
  const [variant, setVariant] = React.useState<'default' | 'continue' | 'signUp'>('default');
  const [style, setStyle] = React.useState<'black' | 'white' | 'whiteOutline'>('black');
  const [corner, setCorner] = React.useState<'square' | 'round' | 'pill'>('round');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <IOSOnlyBanner />

        <UserCard state="signed-out" user={null} error={null} />

        <ScopesPicker value={scopes} onChange={noop} disabled />

        <SiwaButton
          variant={variant}
          style={style}
          corner={corner}
          onPress={noop}
          disabled
          onVariantChange={setVariant}
          onStyleChange={setStyle}
          onCornerChange={setCorner}
        />

        <Pressable style={styles.signOutButton} onPress={noop} disabled testID="siwa-sign-out">
          <ThemedText type="default" themeColor="textSecondary">
            Sign Out
          </ThemedText>
        </Pressable>

        <CredentialStateCard state={null} hasUser={false} onRefresh={noop} />
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
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    opacity: 0.5,
  },
});
