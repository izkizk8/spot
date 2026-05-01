/**
 * T027: screen.android.tsx — Android fallback screen
 *
 * Same composition as iOS but with "iOS 16+ only" banner at top.
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
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
  const [chartType, setChartType] = useState<ChartType>('line');
  const [data, setData] = useState<Dataset>(initialDataset());
  const [tint, setTint] = useState<Tint>(TINTS[0]);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [selectedIndex] = useState<number | null>(null);

  const handleChartTypeChange = (newType: ChartType) => {
    setChartType(newType);
  };

  const handleRandomize = () => {
    setData((d) => randomize(d));
  };

  const handleAdd = () => {
    setData((d) => addPoint(d));
  };

  const handleRemove = () => {
    setData((d) => removePoint(d));
  };

  const handleToggleGradient = () => {
    setGradientEnabled((g) => !g);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.banner}>
        <ThemedText style={styles.bannerText}>
          This module uses Apple's Swift Charts on iOS 16+; Android sees a React Native fallback.
          Mark selection is available on iOS 16+ only.
        </ThemedText>
      </ThemedView>

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
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FFF3CD',
  },
  bannerText: {
    fontSize: 14,
    color: '#856404',
  },
  section: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
