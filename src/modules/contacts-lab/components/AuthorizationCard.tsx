/**
 * AuthorizationCard — Displays current Contacts authorization status and an
 * appropriate call-to-action: request access (when notDetermined) or open
 * Settings (when denied).
 */

import React from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AuthorizationStatus } from '../types';

interface AuthorizationCardProps {
  status: AuthorizationStatus;
  onRequestAccess: () => void;
  inFlight: boolean;
}

function statusHeading(status: AuthorizationStatus): string {
  switch (status) {
    case 'notDetermined':
      return 'Access to contacts not requested yet';
    case 'denied':
      return 'Access to contacts denied';
    case 'authorized':
      return 'Full access to contacts granted';
    case 'limited':
      return 'Limited access to contacts granted';
    default:
      return `Status: ${status}`;
  }
}

function statusDescription(status: AuthorizationStatus): string {
  switch (status) {
    case 'authorized':
      return 'You can read and write all contacts.';
    case 'limited':
      return 'You can only access selected contacts (iOS 18+).';
    case 'denied':
      return 'Open Settings to grant access.';
    case 'notDetermined':
      return 'Request access to continue.';
    default:
      return '';
  }
}

export function AuthorizationCard({ status, onRequestAccess, inFlight }: AuthorizationCardProps) {
  const showRequest = status === 'notDetermined';
  const showSettings = status === 'denied';

  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='contacts-auth-card'>
      <ThemedText type='subtitle' style={styles.title}>
        Contacts Access
      </ThemedText>

      <ThemedText type='small' testID='contacts-auth-status'>
        {statusHeading(status)}
      </ThemedText>

      <ThemedText type='small' themeColor='textSecondary'>
        {statusDescription(status)}
      </ThemedText>

      {showRequest ? (
        <Pressable
          style={styles.button}
          onPress={onRequestAccess}
          disabled={inFlight}
          testID='contacts-request-button'
        >
          <ThemedText type='small' themeColor='tintA'>
            {inFlight ? 'Requesting...' : 'Request Access'}
          </ThemedText>
        </Pressable>
      ) : null}

      {showSettings ? (
        <Pressable
          style={styles.button}
          onPress={() => Linking.openSettings()}
          testID='contacts-settings-link'
        >
          <ThemedText type='small' themeColor='tintA'>
            Open Settings
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  button: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    alignSelf: 'flex-start',
  },
});
