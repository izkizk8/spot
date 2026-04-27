/**
 * T010: screen.tsx — iOS variant (default)
 *
 * Main screen composition for iOS 16+.
 * No "iOS 16+ only" banner. Uses real Swift Charts via ChartView.tsx.
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import {
  initialDataset,
  randomize,
  addPoint,
  removePoint,
  TINTS,
  MIN_SERIES_SIZE,
  MAX_SERIES_SIZE,
  type ChartType,
  type Dataset,
  type Tint,
} from './data';
import { ChartTypePicker } from './components/ChartTypePicker';
import { ChartView } from './components/ChartView';
import { DataControls } from './components/DataControls';
import { TintPicker } from './components/TintPicker';

export default function SwiftChartsLabScreen() {
  // State
  const [chartType, setChartType] = useState<ChartType>('line');
  const [data, setData] = useState<Dataset>(initialDataset());
  const [tint, setTint] = useState<Tint>(TINTS[0]);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Handlers that clear selection (FR-026)
  const handleChartTypeChange = (newType: ChartType) => {
    setChartType(newType);
    setSelectedIndex(null);
  };

  const handleRandomize = () => {
    setData((d) => randomize(d));
    setSelectedIndex(null);
  };

  const handleAdd = () => {
    setData((d) => addPoint(d));
    setSelectedIndex(null);
  };

  const handleRemove = () => {
    setData((d) => removePoint(d));
    setSelectedIndex(null);
  };

  const handleToggleGradient = () => {
    setGradientEnabled((g) => !g);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.section}>
        <ChartTypePicker value={chartType} onChange={handleChartTypeChange} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ChartView
          type={chartType}
          data={data}
          tint={tint}
          gradientEnabled={gradientEnabled}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          minHeight={300}
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <DataControls
          onRandomize={handleRandomize}
          onAdd={handleAdd}
          addDisabled={data.length >= MAX_SERIES_SIZE}
          onRemove={handleRemove}
          removeDisabled={data.length <= MIN_SERIES_SIZE}
          gradientEnabled={gradientEnabled}
          onToggleGradient={handleToggleGradient}
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <TintPicker value={tint} onChange={setTint} tints={TINTS} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  section: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
