/**
 * DiscoverButton Component
 * Feature: 051-tap-to-pay
 *
 * Button to initiate reader discovery with status display.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { DiscoveryStatus } from '@/native/taptopay.types';

interface DiscoverButtonProps {
  status: DiscoveryStatus;
  onPress: () => void;
  style?: ViewStyle;
}

export default function DiscoverButton({ status, onPress, style }: DiscoverButtonProps) {
  const isDiscovering = status === 'discovering';
  const buttonLabel =
    status === 'idle'
      ? 'Discover Reader'
      : status === 'discovering'
        ? 'Discovering...'
        : status === 'ready'
          ? 'Reader Ready'
          : 'Discovery Failed';

  const statusColor =
    status === 'ready'
      ? 'green'
      : status === 'error'
        ? 'red'
        : status === 'discovering'
          ? 'orange'
          : 'gray';

  return (
    <ThemedView style={[styles.container, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDiscovering}
        style={[styles.button, isDiscovering && styles.buttonDisabled]}
      >
        <ThemedText style={styles.buttonText}>{buttonLabel}</ThemedText>
      </Pressable>
      <ThemedView style={styles.statusRow}>
        <ThemedText style={[styles.statusPill, { color: statusColor }]}>●</ThemedText>
        <ThemedText style={styles.statusText}>{status}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusPill: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
  },
});
