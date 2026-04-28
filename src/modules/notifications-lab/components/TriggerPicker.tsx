import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { TriggerSpec } from '../types';

interface Props {
  value: TriggerSpec;
  onChange: (value: TriggerSpec) => void;
  locationAuthorized: boolean;
}

export function TriggerPicker({ value, onChange, locationAuthorized }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onChange({ kind: 'immediate' })}>
        <ThemedText>Immediate</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onChange({ kind: 'in-seconds', seconds: 30 })}>
        <ThemedText>In N seconds</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onChange({ kind: 'at-time', date: new Date() })}>
        <ThemedText>At specific time</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onChange({ kind: 'daily-at-time', hour: 9, minute: 0 })}>
        <ThemedText>Daily at time</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          locationAuthorized &&
          onChange({
            kind: 'on-region-entry',
            latitude: 37.7749,
            longitude: -122.4194,
            radius: 100,
          })
        }
        accessibilityState={{ disabled: !locationAuthorized }}
        disabled={!locationAuthorized}
      >
        <ThemedText>On region entry</ThemedText>
      </TouchableOpacity>

      {!locationAuthorized && <ThemedText>Location permission required</ThemedText>}

      {value.kind === 'in-seconds' && value.seconds < 1 && (
        <ThemedText testID="validation-error">Must be at least 1</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
});
