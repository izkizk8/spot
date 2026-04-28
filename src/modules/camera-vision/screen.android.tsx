/**
 * Camera Vision screen — Android implementation (feature 017, User Story 5).
 *
 * Shows live camera preview with iOS-only banner. No Vision analysis.
 */

import React, { useRef, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { CameraPreview } from './components/CameraPreview';
import { ModePicker } from './components/ModePicker';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import type { VisionMode } from './vision-types';

export default function CameraVisionScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<VisionMode>('faces');
  const cameraRef = useRef<CameraView | null>(null);

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
        <ThemedText type="title" style={styles.messageTitle}>
          Camera Permission Required
        </ThemedText>
        <ThemedText type="default" style={styles.messageText}>
          This module needs camera access.
        </ThemedText>
        <Pressable
          style={styles.retryButton}
          onPress={requestPermission}
        >
          <ThemedText type="default" themeColor="tintA">
            Retry
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraPreview ref={cameraRef} facing="back" flashMode="off" />
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
});
