/**
 * WidgetPreview — RN-rendered Small / Medium / Large preview cards.
 *
 * Pure presentation: the parent owns `config`. No internal state.
 * Pulls hex values from a local `tints.ts` map (in-module per FR-050).
 *
 * @see specs/014-home-widgets/tasks.md T032
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { TINT_HEX } from '@/modules/widgets-lab/tints';
import type { WidgetConfig } from '@/modules/widgets-lab/widget-config';

export interface WidgetPreviewProps {
  readonly config: WidgetConfig;
}

interface SizeSpec {
  readonly label: 'Small' | 'Medium' | 'Large';
  readonly width: number;
  readonly height: number;
  readonly counterFontSize: number;
  readonly headlineFontSize: number;
}

const SIZES: readonly SizeSpec[] = [
  { label: 'Small', width: 158, height: 158, counterFontSize: 28, headlineFontSize: 14 },
  { label: 'Medium', width: 338, height: 158, counterFontSize: 36, headlineFontSize: 16 },
  { label: 'Large', width: 338, height: 354, counterFontSize: 64, headlineFontSize: 18 },
];

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const tintHex = TINT_HEX[config.tint];

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Preview</ThemedText>
      <View style={styles.row}>
        {SIZES.map((s) => (
          <View
            key={s.label}
            accessibilityLabel={`Preview ${s.label}`}
            style={[styles.card, { width: s.width, height: s.height, borderColor: tintHex }]}
          >
            <ThemedText style={[styles.headline, { color: tintHex, fontSize: s.headlineFontSize }]}>
              {config.showcaseValue}
            </ThemedText>
            <View style={styles.spacer} />
            <ThemedText style={[styles.counter, { color: tintHex, fontSize: s.counterFontSize }]}>
              {config.counter}
            </ThemedText>
            <ThemedText style={styles.sizeLabel}>{s.label}</ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  headline: {
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  counter: {
    fontWeight: '700',
  },
  sizeLabel: {
    fontSize: 12,
    color: '#60646C',
    marginTop: Spacing.one,
  },
});
