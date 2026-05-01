/**
 * CapabilitiesCard — Renders biometric capabilities + Refresh button.
 *
 * Four labeled rows: hardware, enrolled, supported types, security level.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { AuthenticationType, SecurityLevel } from 'expo-local-authentication';

import type { Capabilities } from '../hooks/useBiometricAuth';

interface CapabilitiesCardProps {
  capabilities: Capabilities | null;
  onRefresh: () => void;
}

function typeLabel(t: number): string {
  switch (t) {
    case AuthenticationType.FINGERPRINT:
      return 'Touch ID / Fingerprint';
    case AuthenticationType.FACIAL_RECOGNITION:
      return 'Face ID / Face / Optic ID';
    case AuthenticationType.IRIS:
      return 'Iris (Android)';
    default:
      return `Unknown (${t})`;
  }
}

function levelLabel(l: number): string {
  switch (l) {
    case SecurityLevel.NONE:
      return 'None';
    case SecurityLevel.SECRET:
      return 'Secret (PIN / Pattern)';
    case SecurityLevel.BIOMETRIC_WEAK:
      return 'Biometric (weak)';
    case SecurityLevel.BIOMETRIC_STRONG:
      return 'Biometric (strong)';
    default:
      return `Unknown (${l})`;
  }
}

export default function CapabilitiesCard({ capabilities, onRefresh }: CapabilitiesCardProps) {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='localauth-capabilities'>
      <ThemedText type='subtitle' style={styles.title}>
        Capabilities
      </ThemedText>

      {capabilities === null ? (
        <ThemedText type='small' themeColor='textSecondary'>
          Loading…
        </ThemedText>
      ) : (
        <>
          <ThemedText type='small' testID='localauth-cap-hardware'>
            Hardware: {capabilities.hasHardware ? 'Available ✓' : 'Not available'}
          </ThemedText>
          <ThemedText type='small' testID='localauth-cap-enrolled'>
            Enrolled: {capabilities.isEnrolled ? 'Yes ✓' : 'No'}
          </ThemedText>
          <ThemedText type='small' testID='localauth-cap-types'>
            Types:{' '}
            {capabilities.types.length === 0
              ? 'None'
              : capabilities.types.map(typeLabel).join(', ')}
          </ThemedText>
          <ThemedText type='small' testID='localauth-cap-level'>
            Security level: {levelLabel(capabilities.securityLevel)}
          </ThemedText>
        </>
      )}

      <Pressable style={styles.button} onPress={onRefresh} testID='localauth-cap-refresh'>
        <ThemedText type='default' themeColor='tintA'>
          Refresh capabilities
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  button: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
});
