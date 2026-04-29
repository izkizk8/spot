/**
 * CharacteristicRow — single characteristic with property pills + Read / Write
 * / Subscribe / Unsubscribe affordances + EventLog.
 * Feature: 035-core-bluetooth
 */

import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CharacteristicEvent, DiscoveredCharacteristic } from '@/native/ble-central.types';
import { hexToBytes, InvalidHexError } from '@/modules/bluetooth-lab/utils/bytes-utils';
import { lookup } from '@/modules/bluetooth-lab/utils/well-known-services';

import EventLog from './EventLog';

interface Props {
  readonly characteristic: DiscoveredCharacteristic;
  readonly events: readonly CharacteristicEvent[];
  readonly onRead: (uuid: string) => void;
  readonly onWrite: (uuid: string, bytes: Uint8Array) => void;
  readonly onSubscribe: (uuid: string) => void;
  readonly onUnsubscribe: (uuid: string) => void;
  readonly onClearEvents: (uuid: string) => void;
}

export default function CharacteristicRow({
  characteristic,
  events,
  onRead,
  onWrite,
  onSubscribe,
  onUnsubscribe,
  onClearEvents,
}: Props) {
  const [hexInput, setHexInput] = useState('');
  const [hexError, setHexError] = useState<string | null>(null);
  const props = characteristic.properties;
  const canRead = props.includes('read');
  const canWrite = props.includes('write') || props.includes('writeWithoutResponse');
  const canSubscribe = props.includes('notify') || props.includes('indicate');
  const label = lookup(characteristic.uuid) ?? `Characteristic ${characteristic.uuid.slice(0, 8)}`;

  const handleWrite = () => {
    try {
      const bytes = hexToBytes(hexInput.replace(/\s+/g, ''));
      setHexError(null);
      onWrite(characteristic.id, bytes);
    } catch (e) {
      setHexError(e instanceof InvalidHexError ? e.message : String(e));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>{label}</ThemedText>
      <View style={styles.pillsRow}>
        {props.map((p) => (
          <View key={p} style={styles.pill} accessibilityLabel={`prop-${p}`}>
            <ThemedText style={styles.pillText}>{p}</ThemedText>
          </View>
        ))}
        {characteristic.isSubscribed ? (
          <View style={[styles.pill, styles.pillActive]} accessibilityLabel="subscribed">
            <ThemedText style={styles.pillText}>subscribed</ThemedText>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          disabled={!canRead}
          onPress={() => onRead(characteristic.id)}
          style={[styles.button, !canRead && styles.buttonDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canRead }}
        >
          <ThemedText style={styles.buttonText}>Read</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!canSubscribe}
          onPress={() =>
            characteristic.isSubscribed
              ? onUnsubscribe(characteristic.id)
              : onSubscribe(characteristic.id)
          }
          style={[styles.button, !canSubscribe && styles.buttonDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubscribe }}
        >
          <ThemedText style={styles.buttonText}>
            {characteristic.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </ThemedText>
        </TouchableOpacity>
      </View>
      {canWrite ? (
        <View style={styles.writeRow}>
          <TextInput
            value={hexInput}
            onChangeText={setHexInput}
            placeholder="hex bytes (e.g. 01ab)"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, hexError != null && styles.inputInvalid]}
            accessibilityLabel="write-hex-input"
          />
          <TouchableOpacity
            disabled={!canWrite}
            onPress={handleWrite}
            style={[styles.button, !canWrite && styles.buttonDisabled]}
            accessibilityRole="button"
          >
            <ThemedText style={styles.buttonText}>Write</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
      {hexError ? <ThemedText style={styles.errorText}>{hexError}</ThemedText> : null}
      <EventLog events={events} onClear={() => onClearEvents(characteristic.id)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.two, borderRadius: Spacing.one, marginVertical: Spacing.one },
  title: { fontSize: 14, fontWeight: '600' },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    backgroundColor: '#5AC8FA',
  },
  pillActive: { backgroundColor: '#34C759' },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: Spacing.two, marginVertical: Spacing.one },
  writeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: '600' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
  },
  inputInvalid: { borderColor: '#FF3B30' },
  errorText: { fontSize: 12, color: '#FF3B30' },
});
