/**
 * AccountStatusCard Component
 * Feature: 052-core-data-cloudkit
 *
 * Surfaces the current `CKAccountStatus` from the bridge.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AccountStatus } from '@/native/coredata-cloudkit.types';

interface AccountStatusCardProps {
  status: AccountStatus | null;
  style?: ViewStyle;
}

const COPY: Record<AccountStatus, string> = {
  available: 'iCloud is available — sync is active.',
  noAccount: 'No iCloud account — sign in to enable sync.',
  restricted: 'iCloud is restricted on this device.',
  couldNotDetermine: 'Account status could not be determined.',
  temporarilyUnavailable: 'iCloud is temporarily unavailable.',
};

export default function AccountStatusCard({ status, style }: AccountStatusCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>CloudKit Account Status</ThemedText>
      <ThemedText style={styles.value}>{status ?? 'unknown'}</ThemedText>
      <ThemedText style={styles.help}>
        {status ? COPY[status] : 'Press refresh to check the iCloud account status.'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
});
