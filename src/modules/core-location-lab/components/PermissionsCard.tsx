/**
 * PermissionsCard component (feature 025).
 *
 * Displays current location authorization status with Request button
 * and Open Settings link.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

export interface PermissionsCardProps {
  /** Optional override for status (useful for testing) */
  status?: PermissionStatus;
  /** Optional override for onRequest (useful for testing) */
  onRequest?: () => void;
}

const statusLabels: Record<PermissionStatus, string> = {
  undetermined: 'Not determined',
  granted: 'When in use',
  denied: 'Denied',
  restricted: 'Restricted',
};

const statusColors: Record<PermissionStatus, string> = {
  undetermined: '#8E8E93',
  granted: '#34C759',
  denied: '#FF3B30',
  restricted: '#FF9500',
};

function mapLocationStatus(status: Location.PermissionStatus | null): PermissionStatus {
  if (!status) return 'undetermined';
  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return 'granted';
    case Location.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}

export function PermissionsCard({
  status: statusProp,
  onRequest: onRequestProp,
}: PermissionsCardProps) {
  const [internalStatus, setInternalStatus] = useState<PermissionStatus>('undetermined');

  useEffect(() => {
    if (statusProp !== undefined) return; // Skip if using prop override

    void Location.getForegroundPermissionsAsync().then((result) => {
      setInternalStatus(mapLocationStatus(result.status));
    });
  }, [statusProp]);

  const handleRequest = useCallback(async () => {
    if (onRequestProp) {
      onRequestProp();
      return;
    }
    const result = await Location.requestForegroundPermissionsAsync();
    setInternalStatus(mapLocationStatus(result.status));
  }, [onRequestProp]);

  const status = statusProp ?? internalStatus;
  const isDenied = status === 'denied';

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  return (
    <ThemedView type='backgroundElement' style={styles.card}>
      <ThemedText type='subtitle' style={styles.title}>
        Permissions
      </ThemedText>

      <ThemedView style={styles.row}>
        <ThemedText>Status</ThemedText>
        <ThemedView style={[styles.pill, { backgroundColor: statusColors[status] }]}>
          <ThemedText style={styles.pillText}>{statusLabels[status]}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.actions}>
        <Pressable
          onPress={isDenied ? undefined : handleRequest}
          style={[styles.button, isDenied && styles.buttonDisabled]}
          disabled={isDenied}
        >
          <ThemedText style={styles.buttonText}>Request</ThemedText>
        </Pressable>

        <Pressable onPress={handleOpenSettings} style={styles.linkContainer}>
          <ThemedText themeColor='tintA' style={styles.link}>
            Open Settings
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  linkContainer: {
    padding: Spacing.one,
  },
  link: {
    fontSize: 14,
  },
});
