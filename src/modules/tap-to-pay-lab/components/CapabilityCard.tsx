/**
 * CapabilityCard Component
 * Feature: 051-tap-to-pay
 *
 * Displays device capability checks with status pills.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface CapabilityCardProps {
  supported: boolean;
  iosVersionOk: boolean;
  entitled: boolean | null;
  style?: ViewStyle;
}

function renderPill(ok: boolean | null) {
  if (ok === null) return '?';
  return ok ? '✓' : '✗';
}

function pillColor(ok: boolean | null) {
  if (ok === null) return 'gray';
  return ok ? 'green' : 'red';
}

export default function CapabilityCard({
  supported,
  iosVersionOk,
  entitled,
  style,
}: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Capability Check</ThemedText>
      <ThemedView style={styles.row}>
        <ThemedText style={[styles.pill, { color: pillColor(supported) }]}>
          {renderPill(supported)}
        </ThemedText>
        <ThemedText>Device Supported</ThemedText>
      </ThemedView>
      <ThemedView style={styles.row}>
        <ThemedText style={[styles.pill, { color: pillColor(iosVersionOk) }]}>
          {renderPill(iosVersionOk)}
        </ThemedText>
        <ThemedText>iOS 16.0+</ThemedText>
      </ThemedView>
      <ThemedView style={styles.row}>
        <ThemedText style={[styles.pill, { color: pillColor(entitled) }]}>
          {renderPill(entitled)}
        </ThemedText>
        <ThemedText>Entitlement Granted</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pill: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 24,
  },
});
