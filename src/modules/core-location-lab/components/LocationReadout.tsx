/**
 * LocationReadout component (feature 025).
 *
 * Pure presentational component displaying location sample data.
 */
import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { LocationSample } from '../types';

export interface LocationReadoutProps {
  sample: LocationSample | null;
  samplesPerMinute: number;
}

const PLACEHOLDER = '—';

function formatValue(value: number | null | undefined, decimals = 4): string {
  if (value === null || value === undefined) return PLACEHOLDER;
  return value.toFixed(decimals);
}

export function LocationReadout({ sample, samplesPerMinute }: LocationReadoutProps) {
  return (
    <ThemedView style={styles.container}>
      <ReadoutRow label="Latitude" value={sample ? formatValue(sample.latitude, 5) : PLACEHOLDER} />
      <ReadoutRow
        label="Longitude"
        value={sample ? formatValue(sample.longitude, 5) : PLACEHOLDER}
      />
      <ReadoutRow label="Altitude" value={sample ? formatValue(sample.altitude, 1) : PLACEHOLDER} />
      <ReadoutRow label="Accuracy" value={sample ? formatValue(sample.accuracy, 1) : PLACEHOLDER} />
      <ReadoutRow label="Speed" value={sample ? formatValue(sample.speed, 1) : PLACEHOLDER} />
      <ReadoutRow label="Heading" value={sample ? formatValue(sample.heading, 1) : PLACEHOLDER} />
      <ReadoutRow label="Samples / min" value={String(samplesPerMinute)} />
    </ThemedView>
  );
}

interface ReadoutRowProps {
  label: string;
  value: string;
}

function ReadoutRow({ label, value }: ReadoutRowProps) {
  return (
    <ThemedView style={styles.row}>
      <ThemedText themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText type="code" style={styles.value}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    minWidth: 100,
    textAlign: 'right',
  },
});
