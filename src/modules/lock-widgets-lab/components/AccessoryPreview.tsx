/**
 * AccessoryPreview — three RN-rendered preview cards for the lock-screen accessory families.
 *
 * Renders Rectangular, Circular, and Inline cards in that order, sized to
 * match documented WidgetKit accessory bounds. Tint applied as accent
 * (border/icon) only, not as background (FR-LW-014, R4).
 *
 * @see specs/027-lock-screen-widgets/tasks.md T027, T032
 * @see specs/027-lock-screen-widgets/spec.md FR-LW-014, FR-LW-031, FR-LW-032, FR-LW-033, FR-LW-050
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Tint } from '@/modules/widgets-lab/widget-config';

export type AccessoryFamily = 'rectangular' | 'circular' | 'inline';

export const ACCESSORY_FAMILIES: readonly AccessoryFamily[] = [
  'rectangular',
  'circular',
  'inline',
] as const;

const TINT_COLORS: Record<Tint, string> = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  pink: '#FF2D55',
};

export interface AccessoryPreviewProps {
  readonly showcaseValue: string;
  readonly counter: number;
  readonly tint: Tint;
}

export function AccessoryPreview({ showcaseValue, counter, tint }: AccessoryPreviewProps) {
  const accentColor = TINT_COLORS[tint];

  return (
    <View style={styles.container}>
      <ThemedView
        style={[styles.rectangular, { borderColor: accentColor }]}
        accessibilityLabel={`Rectangular accessory preview, tint: ${tint}`}
      >
        <ThemedText style={[styles.showcaseText, { color: accentColor }]}>
          {showcaseValue}
        </ThemedText>
        <ThemedText style={styles.counterText}>{counter}</ThemedText>
      </ThemedView>

      <ThemedView
        style={[styles.circular, { borderColor: accentColor }]}
        accessibilityLabel={`Circular accessory preview, tint: ${tint}`}
      >
        <ThemedText style={[styles.circularText, { color: accentColor }]}>{counter}</ThemedText>
      </ThemedView>

      <ThemedView
        style={[styles.inline, { borderColor: accentColor }]}
        accessibilityLabel={`Inline accessory preview, tint: ${tint}`}
      >
        <ThemedText style={[styles.inlineText, { color: accentColor }]}>
          {showcaseValue} · {counter}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rectangular: {
    width: 170,
    height: 72,
    borderWidth: 2,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    justifyContent: 'center',
    alignItems: 'flex-start',
  } as ViewStyle,
  showcaseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  counterText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  circular: {
    width: 72,
    height: 72,
    borderWidth: 2,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  circularText: {
    fontSize: 24,
    fontWeight: '700',
  },
  inline: {
    width: '100%',
    height: 24,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
    alignItems: 'flex-start',
  } as ViewStyle,
  inlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
