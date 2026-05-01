/**
 * PermissionsCard — Bluetooth permission pill + Request / Open Settings.
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PermissionStatus } from '@/native/ble-central.types';

interface Props {
  readonly status: PermissionStatus;
  readonly onRequest: () => void;
}

const PILL_COLOR: Record<PermissionStatus, string> = {
  granted: '#34C759',
  denied: '#FF3B30',
  undetermined: '#8E8E93',
  restricted: '#FF9500',
  notApplicable: '#8E8E93',
};

export default function PermissionsCard({ status, onRequest }: Props) {
  // The iOS<13 short-circuit lives in the bridge, so the UI always offers a
  // Request affordance for the prompt-able states. Open Settings is only
  // surfaced for terminal denied / restricted states.
  const showRequest = status === 'undetermined' || status === 'denied';
  const showOpenSettings = status === 'denied' || status === 'restricted';

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Permission</ThemedText>
      <View style={styles.row}>
        <View
          style={[styles.pill, { backgroundColor: PILL_COLOR[status] }]}
          accessibilityLabel={`permission-${status}`}
        >
          <ThemedText style={styles.pillText}>{status}</ThemedText>
        </View>
        {showRequest ? (
          <TouchableOpacity onPress={onRequest} style={styles.button} accessibilityRole='button'>
            <ThemedText style={styles.buttonText}>Request</ThemedText>
          </TouchableOpacity>
        ) : null}
        {showOpenSettings ? (
          <TouchableOpacity
            onPress={() => {
              Linking.openSettings().catch(() => undefined);
            }}
            style={styles.button}
            accessibilityRole='button'
          >
            <ThemedText style={styles.buttonText}>Open Settings</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pill: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.one },
  pillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
