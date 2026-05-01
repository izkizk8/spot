import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Reason =
  | 'permissions'
  | 'categories'
  | 'pending'
  | 'delivered'
  | 'compose-fields'
  | 'web-fallback';

interface Props {
  reason: Reason;
}

const COPY: Record<Reason, string> = {
  permissions:
    'Permission management is iOS-only. The User Notifications framework requires explicit authorization.',
  categories:
    'Action categories are iOS-only. They allow users to respond to notifications with predefined actions.',
  pending:
    'Scheduled notifications list is iOS-only. Android does not expose a pending notifications API.',
  delivered:
    'Delivered notifications list is iOS-only. Android does not expose a presented notifications API.',
  'compose-fields':
    'Some compose fields are iOS-only: interruption level, badge, thread ID, and custom sounds.',
  'web-fallback':
    'This feature uses the native Notifications API. The browser Notification API supports only title + body + immediate trigger.',
};

export function IOSOnlyBanner({ reason }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.text}>{COPY[reason]}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  text: {
    fontSize: 14,
    color: '#856404',
  },
});
