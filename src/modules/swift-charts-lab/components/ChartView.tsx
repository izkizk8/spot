/**
 * T009: ChartView.tsx — iOS variant
 *
 * Wraps the local Swift ChartView extension in @expo/ui Host.
 * Per research.md Decision 1, this uses requireNativeViewManager
 * to bridge to the Swift body defined in native/ios/.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Host } from '@expo/ui/swift-ui';
import { requireNativeViewManager } from 'expo-modules-core';

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

// The native Swift view registered as 'SwiftChartsLabChartView'
const NativeChartView = requireNativeViewManager('SwiftChartsLabChartView');

export function ChartView({
  type,
  data,
  tint,
  gradientEnabled,
  selectedIndex,
  onSelect,
  minHeight = 300,
  testID,
}: ChartViewProps) {
  const handleSelect = React.useCallback(
    (event: any) => {
      if (onSelect) {
        // Handle both { nativeEvent: { index } } and { index } shapes
        const index = event.nativeEvent?.index !== undefined ? event.nativeEvent.index : event.index;
        onSelect(index ?? null);
      }
    },
    [onSelect],
  );

  return (
    <Host>
      <NativeChartView
        type={type}
        data={data}
        tint={tint.value} // Forward hex string, not full object
        gradientEnabled={gradientEnabled}
        selectedIndex={selectedIndex ?? null}
        onSelect={onSelect ? handleSelect : undefined}
        style={[styles.chart, { minHeight }]}
        testID={testID}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  chart: {
    width: '100%',
  },
});
