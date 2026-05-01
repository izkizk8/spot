/**
 * CapabilityCard Component
 * Feature: 057-photokit
 *
 * Surfaces the photo-library authorization status and iOS version info.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AuthorizationStatus } from '@/native/photokit.types';

interface CapabilityCardProps {
  authorizationStatus: AuthorizationStatus | null;
  style?: ViewStyle;
}

function statusLabel(status: AuthorizationStatus): string {
  switch (status) {
    case 'authorized':
      return '✅ Authorized (full access)';
    case 'limited':
      return '🔶 Limited access';
    case 'denied':
      return '❌ Denied';
    case 'restricted':
      return '🚫 Restricted';
    case 'notDetermined':
      return '❓ Not determined';
  }
}

export default function CapabilityCard({ authorizationStatus, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>PhotoKit Capability</ThemedText>
      <ThemedText style={styles.help}>Requires iOS 14+</ThemedText>
      {authorizationStatus === null ? (
        <ThemedText style={styles.help}>Authorization status not checked yet.</ThemedText>
      ) : (
        <ThemedText style={styles.value}>{statusLabel(authorizationStatus)}</ThemedText>
      )}
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
