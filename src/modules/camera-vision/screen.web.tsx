/**
 * Camera Vision screen — Web implementation (feature 017, User Story 5).
 *
 * Shows static placeholder with iOS-only banner. No camera, no Vision analysis.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';

import { CameraPreview } from './components/CameraPreview';
import { ModePicker } from './components/ModePicker';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import type { VisionMode } from './vision-types';

export default function CameraVisionScreen() {
  const [mode, setMode] = useState<VisionMode>('faces');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraPreview facing="back" flashMode="off" />
      </View>

      <IOSOnlyBanner />
      <ModePicker mode={mode} onModeChange={setMode} disabled={true} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
});
