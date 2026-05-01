/**
 * AuthorizationCard — Displays current EventKit authorization status and an
 * appropriate call-to-action: request access (when notDetermined) or open
 * Settings (when denied/restricted).
 */

import React from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AuthorizationStatus, ReminderAuthorizationStatus } from '../types';

type EntityType = 'calendar' | 'reminder';

interface AuthorizationCardProps {
  entityType: EntityType;
  status: AuthorizationStatus | ReminderAuthorizationStatus;
  onRequestAccess: () => void;
  inFlight: boolean;
}

const ENTITY_LABELS: Record<EntityType, { singular: string; plural: string }> = {
  calendar: { singular: 'calendar', plural: 'calendars and events' },
  reminder: { singular: 'reminders', plural: 'reminders' },
};

function statusHeading(entityType: EntityType, status: string): string {
  const label = ENTITY_LABELS[entityType];
  switch (status) {
    case 'notDetermined':
      return `Access to ${label.plural} not requested yet`;
    case 'denied':
      return `Access to ${label.plural} denied`;
    case 'restricted':
      return `Access to ${label.plural} restricted`;
    case 'authorized':
      return `Full access to ${label.plural} granted`;
    case 'writeOnly':
      return `Write-only access to ${label.plural}`;
    case 'fullAccess':
      return `Full access to ${label.plural} granted`;
    default:
      return `Status: ${status}`;
  }
}

function statusDescription(entityType: EntityType, status: string): string {
  const label = ENTITY_LABELS[entityType];
  switch (status) {
    case 'authorized':
      return `You can read and write ${label.plural}.`;
    case 'fullAccess':
      return `You can read and write ${label.plural}.`;
    case 'writeOnly':
      return `You can create new ${label.singular} entries but cannot read existing ones.`;
    case 'denied':
      return 'Open Settings to grant access.';
    case 'restricted':
      return 'Access is restricted by parental controls or device management.';
    case 'notDetermined':
      return 'Request access to continue.';
    default:
      return '';
  }
}

export function AuthorizationCard({
  entityType,
  status,
  onRequestAccess,
  inFlight,
}: AuthorizationCardProps) {
  const showRequest = status === 'notDetermined';
  const showSettings = status === 'denied' || status === 'restricted';

  return (
    <ThemedView
      style={styles.container}
      type='backgroundElement'
      testID={`eventkit-auth-${entityType}`}
    >
      <ThemedText type='subtitle' style={styles.title}>
        {entityType === 'calendar' ? 'Calendar Access' : 'Reminders Access'}
      </ThemedText>

      <ThemedText type='small' testID={`eventkit-auth-${entityType}-status`}>
        {statusHeading(entityType, status)}
      </ThemedText>

      <ThemedText type='small' themeColor='textSecondary'>
        {statusDescription(entityType, status)}
      </ThemedText>

      {showRequest ? (
        <Pressable
          style={styles.button}
          onPress={onRequestAccess}
          disabled={inFlight}
          testID={`eventkit-auth-${entityType}-request`}
        >
          <ThemedText type='default' themeColor='tintA'>
            {inFlight ? 'Requesting…' : 'Request Access'}
          </ThemedText>
        </Pressable>
      ) : null}

      {showSettings ? (
        <Pressable
          style={styles.button}
          onPress={() => {
            void Linking.openSettings();
          }}
          testID={`eventkit-auth-${entityType}-settings`}
        >
          <ThemedText type='link' themeColor='tintA'>
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
    marginTop: Spacing.one,
  },
});
