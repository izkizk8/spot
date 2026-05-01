/**
 * ScanControls — scan toggle + filter input + allow-duplicates switch.
 * Feature: 035-core-bluetooth
 */

import React, { useState } from 'react';
import { StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CentralState, ScanState } from '@/native/ble-central.types';

interface Props {
  readonly central: CentralState;
  readonly scan: ScanState;
  readonly allowDuplicates: boolean;
  readonly onScanToggle: (next: boolean) => void;
  readonly onFilterChange: (commaSeparated: string) => void;
  readonly onAllowDuplicatesChange: (next: boolean) => void;
}

const PILL_COLOR: Record<ScanState, string> = {
  idle: '#8E8E93',
  scanning: '#34C759',
  paused: '#FF9500',
};

const UUID_SHORT_RE = /^[0-9a-fA-F]{4}$/;
const UUID_FULL_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function validateFilter(input: string): boolean {
  if (input.trim().length === 0) return true;
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .every((p) => UUID_SHORT_RE.test(p) || UUID_FULL_RE.test(p));
}

export default function ScanControls({
  central,
  scan,
  allowDuplicates,
  onScanToggle,
  onFilterChange,
  onAllowDuplicatesChange,
}: Props) {
  const [filterInput, setFilterInput] = useState('');
  const [filterValid, setFilterValid] = useState(true);
  const isDisabled = central !== 'poweredOn';
  const scanOn = scan === 'scanning' || scan === 'paused';

  const handleFilter = (text: string) => {
    setFilterInput(text);
    const valid = validateFilter(text);
    setFilterValid(valid);
    if (valid) {
      onFilterChange(text);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Scan</ThemedText>
      <View style={styles.row}>
        <View
          style={[styles.pill, { backgroundColor: PILL_COLOR[scan] }]}
          accessibilityLabel={`scan-${scan}`}
        >
          <ThemedText style={styles.pillText}>{scan}</ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => onScanToggle(!scanOn)}
          disabled={isDisabled || !filterValid}
          style={[styles.button, (isDisabled || !filterValid) && styles.buttonDisabled]}
          accessibilityRole='button'
          accessibilityState={{ disabled: isDisabled || !filterValid }}
        >
          <ThemedText style={styles.buttonText}>{scanOn ? 'Stop' : 'Start'}</ThemedText>
        </TouchableOpacity>
      </View>
      {isDisabled ? (
        <ThemedText style={styles.caption}>Bluetooth must be powered on to scan.</ThemedText>
      ) : null}
      <ThemedText style={styles.label}>Service UUID filter</ThemedText>
      <TextInput
        style={[styles.input, !filterValid && styles.inputInvalid]}
        value={filterInput}
        onChangeText={handleFilter}
        placeholder='comma-separated UUIDs'
        autoCapitalize='none'
        autoCorrect={false}
        accessibilityLabel='scan-filter-input'
      />
      {!filterValid ? <ThemedText style={styles.errorText}>Invalid UUID format</ThemedText> : null}
      <View style={styles.row}>
        <ThemedText style={styles.label}>Allow duplicates</ThemedText>
        <Switch
          value={allowDuplicates}
          onValueChange={onAllowDuplicatesChange}
          accessibilityLabel='allow-duplicates'
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.one,
  },
  pill: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.one },
  pillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: '600' },
  caption: { fontSize: 12, opacity: 0.7, marginVertical: Spacing.one },
  label: { fontSize: 14, marginVertical: Spacing.one },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
    marginVertical: Spacing.one,
  },
  inputInvalid: { borderColor: '#FF3B30' },
  errorText: { fontSize: 12, color: '#FF3B30' },
});
