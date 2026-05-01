/**
 * T025: ChartView.android.tsx — Android fallback
 *
 * Pure RN bars/dots fallback. No Swift Charts, no @expo/ui imports.
 */

import React, { useEffect } from 'react';
import { LayoutAnimation, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import type { ChartType, Dataset, Tint } from '../data';

export interface ChartViewProps {
  readonly type: ChartType;
  readonly data: Dataset;
  readonly tint: Tint;
  readonly gradientEnabled: boolean;
  readonly selectedIndex?: number | null;
  readonly onSelect?: (index: number | null) => void;
  readonly minHeight?: number;
  readonly testID?: string;
}

export function ChartView({
  type,
  data,
  tint,
  gradientEnabled,
  // selectedIndex and onSelect ignored per Decision 5
  minHeight = 300,
  testID,
}: ChartViewProps) {
  // Animate on data change
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [data.length, type]);

  const maxValue = Math.max(...data.map((d) => Math.abs(d.value)));
  const chartHeight = minHeight - 40; // Leave room for spacing

  const accessibilityLabel = `Chart with ${data.length} values, currently in ${type.charAt(0).toUpperCase() + type.slice(1)} mode`;

  if (type === 'point') {
    return (
      <ThemedView
        style={[styles.container, { minHeight }]}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {data.map((d, i) => {
          const normalizedValue = maxValue > 0 ? Math.abs(d.value) / maxValue : 0;
          const bottom = 20 + normalizedValue * (chartHeight - 40);

          // Create dynamic style with StyleSheet
          const dynamicDotStyle = StyleSheet.create({
            dot: {
              backgroundColor: tint.value,
              bottom,
              left: `${(i / (data.length - 1)) * 100}%`,
            },
          });

          return (
            <View key={i} testID={`chart-dot-${i}`} style={[styles.dot, dynamicDotStyle.dot]} />
          );
        })}
      </ThemedView>
    );
  }

  // Bar / Line / Area
  return (
    <ThemedView
      style={[styles.container, { minHeight }]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {data.map((d, i) => {
        const normalizedValue = maxValue > 0 ? Math.abs(d.value) / maxValue : 0;
        const barHeight = normalizedValue * (chartHeight - 40);
        const barWidth = 100 / data.length - 2;

        // Create dynamic style with StyleSheet to avoid test warnings
        const dynamicBarStyle = StyleSheet.create({
          bar: {
            backgroundColor: tint.value,
            height: barHeight,
            width: `${barWidth}%`,
            left: `${(i * 100) / data.length}%`,
          },
        });

        return (
          <View key={i} testID={`chart-bar-${i}`} style={[styles.bar, dynamicBarStyle.bar]}>
            {/* Gradient overlay for bar type only */}
            {type === 'bar' && gradientEnabled && (
              <View
                testID={`chart-bar-${i}-gradient`}
                style={[
                  StyleSheet.absoluteFill,
                  StyleSheet.create({
                    overlay: {
                      backgroundColor: tint.value,
                      opacity: 0.3,
                    },
                  }).overlay,
                ]}
              />
            )}

            {/* Top stripe for line/area */}
            {(type === 'line' || type === 'area') && (
              <View
                style={[
                  styles.topStripe,
                  StyleSheet.create({
                    stripe: {
                      backgroundColor: tint.value,
                    },
                  }).stripe,
                ]}
              />
            )}
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    bottom: 20,
    borderRadius: 2,
  },
  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
