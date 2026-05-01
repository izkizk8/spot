/**
 * AddSamplePassCard — bundled sample pass affordance.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ClassifiedError } from '@/modules/passkit-lab/hooks/usePassKit';

interface Props {
  readonly bundledSample: string | null;
  readonly onAddFromBytes: (base64: string) => void;
  readonly lastError: ClassifiedError | null;
  readonly lastResult: { added: boolean } | null;
}

export function AddSamplePassCard({ bundledSample, onAddFromBytes, lastError, lastResult }: Props) {
  const handlePress = () => {
    if (bundledSample) {
      onAddFromBytes(bundledSample);
    }
  };

  const getStatusText = () => {
    if (!bundledSample) {
      return 'Pass signing required — see quickstart.md';
    }
    if (lastError) {
      return lastError.message;
    }
    if (lastResult?.added) {
      return 'Pass added';
    }
    return null;
  };

  const statusText = getStatusText();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Bundled Sample</ThemedText>
      <TouchableOpacity
        onPress={handlePress}
        accessibilityRole='button'
        style={[styles.button, !bundledSample && styles.buttonDisabled]}
        disabled={!bundledSample}
      >
        <ThemedText style={styles.buttonText}>Try with bundled (unsigned) sample</ThemedText>
      </TouchableOpacity>
      {statusText && <ThemedText style={styles.status}>{statusText}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  status: { fontSize: 12, opacity: 0.7, marginTop: Spacing.two },
});
