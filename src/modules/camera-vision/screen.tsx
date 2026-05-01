/**
 * Camera Vision screen — iOS implementation (feature 017, User Story 1).
 *
 * Displays live camera preview with Vision analysis overlays.
 */

import React, { useRef, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { CameraPreview } from './components/CameraPreview';
import { OverlayCanvas } from './components/OverlayCanvas';
import { ModePicker } from './components/ModePicker';
import { StatsBar } from './components/StatsBar';
import { CameraControls } from './components/CameraControls';
import { useFrameAnalyzer } from './hooks/useFrameAnalyzer';
import type { VisionMode } from './vision-types';
import { VisionNotSupported } from '@/native/vision-detector.types';

export default function CameraVisionScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<VisionMode>('faces');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'auto' | 'on'>('off');
  const [parentLayout, setParentLayout] = useState({ width: 0, height: 0 });
  const cameraRef = useRef<CameraView | null>(null);

  const { fps, lastAnalysisMs, detected, observations, error } = useFrameAnalyzer({
    mode,
    intervalMs: 250,
    cameraRef,
  });

  const flashAvailable = facing === 'back';

  // Request permission on mount
  React.useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Permission denied UI
  if (permission && !permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type='title' style={styles.messageTitle}>
          Camera Permission Required
        </ThemedText>
        <ThemedText type='default' style={styles.messageText}>
          This module needs camera access to perform live Vision analysis.
        </ThemedText>
        <Pressable style={styles.retryButton} onPress={requestPermission}>
          <ThemedText type='default' themeColor='tintA'>
            Retry
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View
        style={styles.cameraContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setParentLayout({ width, height });
        }}
      >
        <CameraPreview ref={cameraRef} facing={facing} flashMode={flashMode} />
        {parentLayout.width > 0 && (
          <OverlayCanvas observations={observations} parentLayout={parentLayout} />
        )}
      </View>

      <CameraControls
        facing={facing}
        flashMode={flashMode}
        flashAvailable={flashAvailable}
        onFlipCamera={() => setFacing(facing === 'back' ? 'front' : 'back')}
        onFlashModeChange={setFlashMode}
      />
      <ModePicker mode={mode} onModeChange={setMode} disabled={false} />
      <StatsBar fps={fps} lastAnalysisMs={lastAnalysisMs} detected={detected} />

      {error && !(error instanceof VisionNotSupported) && (
        <ThemedView style={styles.errorBanner}>
          <ThemedText type='small' themeColor='textSecondary'>
            Error: {error.message}
          </ThemedText>
        </ThemedView>
      )}
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
  messageTitle: {
    marginTop: Spacing.four,
    textAlign: 'center',
  },
  messageText: {
    marginTop: Spacing.two,
    marginHorizontal: Spacing.four,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignSelf: 'center',
  },
  errorBanner: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
