/**
 * CoreML Lab screen — Web variant (feature 016).
 *
 * Same as the Android variant: iOS-only banner + educational scaffold
 * in disabled mode.
 */

import React from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MODEL_REGISTRY } from './model-registry';
import { SampleImageGrid } from './components/SampleImageGrid';
import { PredictionsChart } from './components/PredictionsChart';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { ModelPicker } from './components/ModelPicker';

export default function CoreMLLabScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedView style={styles.section}>
          <ThemedText type='title' style={styles.title}>
            CoreML Lab
          </ThemedText>
          <ThemedText type='small' themeColor='textSecondary' style={styles.subtitle}>
            On-device image classification with MobileNetV2
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.banner}>
          <ThemedText type='small' style={styles.bannerText}>
            ⚠️ CoreML is iOS-only. This module demonstrates Apple's CoreML framework.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <SampleImageGrid selectedId={null} onSelect={() => {}} />
        </ThemedView>

        <ThemedView style={styles.section}>
          <Pressable style={styles.classifyButtonDisabled} disabled>
            <ThemedText style={styles.classifyButtonText}>Run Inference (iOS only)</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <PredictionsChart predictions={[]} />
        </ThemedView>

        <ThemedView style={styles.section}>
          <PerformanceMetrics inferenceMs={null} computeUnits={[]} />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ModelPicker
            models={MODEL_REGISTRY}
            selectedModelId={MODEL_REGISTRY[0].name}
            onSelect={() => {}}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingVertical: Spacing.three,
  },
  section: {
    marginBottom: Spacing.three,
  },
  title: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.one,
  },
  subtitle: {
    paddingHorizontal: Spacing.three,
  },
  banner: {
    backgroundColor: '#FF9500',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderRadius: Spacing.one,
  },
  bannerText: {
    color: '#ffffff',
    textAlign: 'center',
  },
  classifyButtonDisabled: {
    backgroundColor: '#C7C7CC',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  classifyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
