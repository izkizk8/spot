/**
 * PeripheralPanel — connected-peripheral status + service tree.
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type {
  CharacteristicEvent,
  ConnectionState,
  DiscoveredService,
} from '@/native/ble-central.types';

import ServiceRow from './ServiceRow';

interface Props {
  readonly peripheralName: string | null;
  readonly peripheralId: string;
  readonly connectionState: ConnectionState;
  readonly services: readonly DiscoveredService[];
  readonly eventsByCharId: Readonly<Record<string, readonly CharacteristicEvent[]>>;
  readonly onDisconnect: () => void;
  readonly onRead: (uuid: string) => void;
  readonly onWrite: (uuid: string, bytes: Uint8Array) => void;
  readonly onSubscribe: (uuid: string) => void;
  readonly onUnsubscribe: (uuid: string) => void;
  readonly onClearEvents: (uuid: string) => void;
}

const PILL_COLOR: Record<ConnectionState, string> = {
  connecting: '#5AC8FA',
  connected: '#34C759',
  disconnecting: '#FF9500',
  disconnected: '#8E8E93',
};

export default function PeripheralPanel({
  peripheralName,
  peripheralId,
  connectionState,
  services,
  eventsByCharId,
  onDisconnect,
  onRead,
  onWrite,
  onSubscribe,
  onUnsubscribe,
  onClearEvents,
}: Props) {
  const canDisconnect = connectionState !== 'disconnected';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.left}>
          <ThemedText style={styles.title}>{peripheralName ?? '(no name)'}</ThemedText>
          <ThemedText style={styles.id}>{peripheralId.slice(0, 8)}</ThemedText>
        </View>
        <View
          style={[styles.pill, { backgroundColor: PILL_COLOR[connectionState] }]}
          accessibilityLabel={`connection-${connectionState}`}
        >
          <ThemedText style={styles.pillText}>{connectionState}</ThemedText>
        </View>
      </View>
      <TouchableOpacity
        onPress={onDisconnect}
        disabled={!canDisconnect}
        style={[styles.disconnectButton, !canDisconnect && styles.disconnectButtonDisabled]}
        accessibilityRole='button'
        accessibilityState={{ disabled: !canDisconnect }}
      >
        <ThemedText style={styles.disconnectText}>Disconnect</ThemedText>
      </TouchableOpacity>
      {services.length === 0 ? (
        <ThemedText style={styles.empty}>No services discovered yet.</ThemedText>
      ) : (
        services.map((s) => (
          <ServiceRow
            key={s.id}
            service={s}
            eventsByCharId={eventsByCharId}
            onRead={onRead}
            onWrite={onWrite}
            onSubscribe={onSubscribe}
            onUnsubscribe={onUnsubscribe}
            onClearEvents={onClearEvents}
          />
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  left: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  id: { fontSize: 12, opacity: 0.6 },
  pill: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.one },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  disconnectButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#FF3B30',
    borderRadius: Spacing.one,
    alignSelf: 'flex-start',
    marginBottom: Spacing.two,
  },
  disconnectButtonDisabled: { backgroundColor: '#ccc' },
  disconnectText: { color: '#fff', fontWeight: '600' },
  empty: { fontSize: 14, opacity: 0.6 },
});
