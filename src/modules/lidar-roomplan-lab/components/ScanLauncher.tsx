/**
 * ScanLauncher — LiDAR / RoomPlan Lab (feature 048).
 *
 * Renders the Start / Stop scan controls. The actual
 * `RoomCaptureView` session is presented natively; this
 * component only routes the user intent through the parent
 * (which calls `bridge.startCapture` / `bridge.stopCapture`).
 * Pure presentational + controlled.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ScanLauncherProps {
  readonly style?: ViewStyle;
  readonly supported: boolean;
  readonly isScanning: boolean;
  readonly onStart: () => void;
  readonly onStop: () => void;
}

export default function ScanLauncher({
  style,
  supported,
  isScanning,
  onStart,
  onStop,
}: ScanLauncherProps) {
  const startDisabled = !supported || isScanning;
  const stopDisabled = !isScanning;
  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='roomplan-scan-launcher'
    >
      <ThemedText type='smallBold'>Capture</ThemedText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole='button'
          accessibilityState={{ disabled: startDisabled }}
          onPress={onStart}
          disabled={startDisabled}
          testID='roomplan-start-scan-button'
          style={[styles.button, styles.start, startDisabled && styles.disabled]}
        >
          <ThemedText type='smallBold'>{isScanning ? 'Scanning…' : 'Start scan'}</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole='button'
          accessibilityState={{ disabled: stopDisabled }}
          onPress={onStop}
          disabled={stopDisabled}
          testID='roomplan-stop-scan-button'
          style={[styles.button, styles.stop, stopDisabled && styles.disabled]}
        >
          <ThemedText type='smallBold'>Stop</ThemedText>
        </Pressable>
      </View>
      <ThemedText type='small' themeColor='textSecondary'>
        Tap Start to launch the system RoomCaptureView. Move slowly around the room and the system
        UI will guide you through the scan.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  start: {
    backgroundColor: 'rgba(80,180,120,0.18)',
  },
  stop: {
    backgroundColor: 'rgba(220,80,80,0.18)',
  },
  disabled: {
    opacity: 0.4,
  },
});
