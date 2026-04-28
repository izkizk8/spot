/**
 * StandByPreview — wide landscape card preview of the StandBy widget.
 *
 * Renders both .systemMedium and .systemLarge stubs with mode-specific
 * visual treatment. Tint is applied as accent, never as background.
 *
 * @see specs/028-standby-mode/tasks.md T024, T031
 * @see specs/028-standby-mode/spec.md FR-SB-040, FR-SB-005, FR-SB-031
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { TINT_HEX } from '@/modules/widgets-lab/tints';
import type { Tint } from '@/modules/widgets-lab/widget-config';
import type { RenderingMode } from '@/modules/standby-lab/standby-config';

export interface StandByPreviewProps {
  readonly showcaseValue: string;
  readonly counter: number;
  readonly tint: Tint;
  readonly mode: RenderingMode;
}

const MEDIUM_WIDTH = 338;
const MEDIUM_HEIGHT = 158;
const LARGE_WIDTH = 338;
const LARGE_HEIGHT = 354;

function modeStyles(
  mode: RenderingMode,
  accent: string,
): {
  card: ViewStyle;
  showcase: { color: string };
  counter: { color: string };
} {
  switch (mode) {
    case 'fullColor':
      return {
        card: { backgroundColor: '#1F1F22', opacity: 1 },
        showcase: { color: accent },
        counter: { color: '#FFFFFF' },
      };
    case 'accented':
      return {
        card: { backgroundColor: '#0A0A0C', opacity: 1 },
        showcase: { color: accent },
        counter: { color: accent },
      };
    case 'vibrant':
      return {
        card: { backgroundColor: '#0A0A0C', opacity: 0.85 },
        showcase: { color: '#FFFFFF' },
        counter: { color: '#FFFFFF' },
      };
  }
}

export function StandByPreview({ showcaseValue, counter, tint, mode }: StandByPreviewProps) {
  const accent = TINT_HEX[tint];
  const ms = modeStyles(mode, accent);

  const labelBase = `mode ${mode}, tint ${tint}`;

  return (
    <View style={styles.container}>
      <ThemedView
        testID="standby-preview-medium"
        style={[
          styles.card,
          { width: MEDIUM_WIDTH, height: MEDIUM_HEIGHT, borderColor: accent },
          ms.card,
        ]}
        accessibilityLabel={`StandBy preview systemMedium, ${labelBase}`}
      >
        <ThemedText style={[styles.showcase, ms.showcase]}>{showcaseValue}</ThemedText>
        <ThemedText style={[styles.counter, ms.counter]}>{counter}</ThemedText>
      </ThemedView>

      <ThemedView
        testID="standby-preview-large"
        style={[
          styles.card,
          { width: LARGE_WIDTH, height: LARGE_HEIGHT, borderColor: accent },
          ms.card,
        ]}
        accessibilityLabel={`StandBy preview systemLarge, ${labelBase}`}
      >
        <ThemedText style={[styles.showcase, ms.showcase]}>{showcaseValue}</ThemedText>
        <ThemedText style={[styles.counterLarge, ms.counter]}>{counter}</ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  card: {
    borderWidth: 2,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  showcase: {
    fontSize: 18,
    fontWeight: '700',
  },
  counter: {
    fontSize: 48,
    fontWeight: '800',
  },
  counterLarge: {
    fontSize: 96,
    fontWeight: '800',
  },
});
