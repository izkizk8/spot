/**
 * MyPassesList — list of passes in Apple Wallet.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PassMetadata } from '@/native/passkit.types';

import { PassRow } from './PassRow';

interface Props {
  readonly passes: PassMetadata[];
  readonly onRefresh: () => void;
  readonly onOpen: (passTypeIdentifier: string, serialNumber: string) => void;
  readonly canOpen: boolean;
}

export function MyPassesList({ passes, onRefresh: _onRefresh, onOpen, canOpen }: Props) {
  if (passes.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>My Passes</ThemedText>
        <ThemedText style={styles.empty}>No passes yet</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>My Passes ({passes.length})</ThemedText>
      <ScrollView style={styles.list}>
        {passes.map((pass) => (
          <PassRow
            key={`${pass.passTypeIdentifier}-${pass.serialNumber}`}
            pass={pass}
            onOpen={onOpen}
            canOpen={canOpen}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  empty: { fontSize: 14, opacity: 0.7, fontStyle: 'italic' },
  list: { maxHeight: 400 },
});
