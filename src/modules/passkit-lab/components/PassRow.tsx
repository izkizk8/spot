/**
 * PassRow — single pass metadata row.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PassMetadata } from '@/native/passkit.types';

import { getPassCategoryLabel } from '../pass-types';

interface Props {
  readonly pass: PassMetadata;
  readonly onOpen: (passTypeIdentifier: string, serialNumber: string) => void;
  readonly canOpen: boolean;
}

export function PassRow({ pass, onOpen, canOpen }: Props) {
  const handleOpen = () => {
    onOpen(pass.passTypeIdentifier, pass.serialNumber);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.metadata}>
        <ThemedText style={styles.serial}>{pass.serialNumber}</ThemedText>
        {pass.organizationName && (
          <ThemedText style={styles.org}>{pass.organizationName}</ThemedText>
        )}
        {pass.localizedDescription && (
          <ThemedText style={styles.description}>{pass.localizedDescription}</ThemedText>
        )}
        <ThemedText style={styles.type}>{getPassCategoryLabel(pass.passType)}</ThemedText>
      </View>
      {canOpen && (
        <TouchableOpacity onPress={handleOpen} accessibilityRole='button' style={styles.openButton}>
          <ThemedText style={styles.openText}>Open in Wallet</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadata: { flex: 1 },
  serial: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  org: { fontSize: 14, fontWeight: '600', marginTop: Spacing.one },
  description: { fontSize: 14, marginTop: Spacing.one },
  type: { fontSize: 12, opacity: 0.7, marginTop: Spacing.one },
  openButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  openText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});
