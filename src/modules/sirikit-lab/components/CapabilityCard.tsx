/**
 * CapabilityCard Component
 * Feature: 071-sirikit
 *
 * Surfaces the SiriKit availability and extension info.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SiriKitInfo } from '@/native/sirikit.types';

interface CapabilityCardProps {
  info: SiriKitInfo | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ info, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>SiriKit Capability</ThemedText>
      {info === null ? (
        <ThemedText style={styles.help}>Loading...</ThemedText>
      ) : info.available ? (
        <>
          <ThemedText style={styles.value}>Available</ThemedText>
          <ThemedText style={styles.help}>Extension: {info.extensionBundleId}</ThemedText>
          <ThemedText style={styles.help}>Domains: {info.supportedDomains.join(', ')}</ThemedText>
          <ThemedText style={styles.help}>Vocabulary entries: {info.vocabularyCount}</ThemedText>
        </>
      ) : (
        <ThemedText style={styles.help}>
          SiriKit is unavailable on this device — requires iOS 10 or later.
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
});
