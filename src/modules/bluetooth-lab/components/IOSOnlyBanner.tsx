/**
 * IOSOnlyBanner-equivalent for the bluetooth-lab module.
 * Feature: 035-core-bluetooth
 *
 * Provides a typed "not supported" notice for the web variant. We keep the
 * banner local to the module to mirror the per-module convention used by
 * notifications-lab / standby-lab / focus-filters-lab / etc., but the props
 * are intentionally identical so it composes the same way.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Reason = 'web-fallback' | 'android-fallback' | 'permissions';

interface Props {
  readonly reason: Reason;
}

const COPY: Record<Reason, string> = {
  'web-fallback':
    'Bluetooth is not available in this browser. Try Chrome/Edge on desktop or Android — Web Bluetooth requires HTTPS and a supported runtime.',
  'android-fallback':
    'Some Bluetooth features are limited on Android. Runtime permission requests vary by Android API level (BLUETOOTH_SCAN / BLUETOOTH_CONNECT on API 31+, ACCESS_FINE_LOCATION on API ≤ 30).',
  permissions:
    'Bluetooth permission has not been granted. Tap Request to prompt; on iOS 13+ this prompt is system-driven.',
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
  text: { fontSize: 14, color: '#856404' },
});

export default IOSOnlyBanner;
