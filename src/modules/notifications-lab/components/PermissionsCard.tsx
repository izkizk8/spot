import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { PermissionsState } from '../types';

interface Props {
  permissions: PermissionsState;
  onRequest: (opts?: { provisional?: boolean }) => void;
}

export function PermissionsCard({ permissions, onRequest }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.status}>{permissions.status}</ThemedText>
      
      <View style={styles.indicators}>
        <ThemedText>Alerts: {permissions.alerts ? 'Yes' : 'No'}</ThemedText>
        <ThemedText>Sounds: {permissions.sounds ? 'Yes' : 'No'}</ThemedText>
        <ThemedText>Badges: {permissions.badges ? 'Yes' : 'No'}</ThemedText>
        <ThemedText>Critical: {permissions.criticalAlerts ? 'Yes' : 'No'}</ThemedText>
        <ThemedText>
          Time Sensitive: {permissions.timeSensitive === null ? 'n/a' : permissions.timeSensitive ? 'Yes' : 'No'}
        </ThemedText>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onRequest()}
      >
        <ThemedText>Request Permission</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onRequest({ provisional: true })}
      >
        <ThemedText>Request Provisional</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Linking.openSettings()}>
        <ThemedText style={styles.link}>Open Settings</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  status: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  indicators: { gap: 8, marginBottom: 16 },
  button: { padding: 12, backgroundColor: '#007AFF', borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  link: { color: '#007AFF', textDecorationLine: 'underline' },
});
