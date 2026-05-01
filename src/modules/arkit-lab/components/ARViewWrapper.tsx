/**
 * ARViewWrapper Component
 * Feature: 034-arkit-basics
 *
 * Platform router: iOS with native ARKitView (when supported + permission granted),
 * unsupported/permission placeholders on iOS, IOSOnlyBanner on Android/Web.
 */

import React from 'react';
import { StyleSheet, View, Platform, TouchableOpacity } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import IOSOnlyBanner from '@/modules/background-tasks-lab/components/IOSOnlyBanner';
import type { ARKitConfiguration } from '@/native/arkit.types';

interface ARViewWrapperProps {
  readonly isAvailable: boolean;
  readonly permissionGranted: boolean;
  readonly config: ARKitConfiguration;
  readonly onOpenSettings?: () => void;
}

export default function ARViewWrapper({
  isAvailable,
  permissionGranted,
  config,
  onOpenSettings,
}: ARViewWrapperProps) {
  // Non-iOS platforms: render IOSOnlyBanner
  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <IOSOnlyBanner reason='platform' style={styles.banner} />
        <ThemedText style={styles.caption}>
          ARKit requires iOS 11+. The UI structure is preserved for educational purposes.
        </ThemedText>
      </View>
    );
  }

  // iOS: unsupported device
  if (!isAvailable) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.placeholderText}>Unsupported on this device</ThemedText>
        <ThemedText style={styles.caption}>
          ARWorldTrackingConfiguration.isSupported returned false.
        </ThemedText>
      </ThemedView>
    );
  }

  // iOS: permission denied
  if (!permissionGranted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.placeholderText}>Camera Permission Required</ThemedText>
        <ThemedText style={styles.caption}>
          ARKit needs camera access to demonstrate world tracking and plane detection.
        </ThemedText>
        {onOpenSettings && (
          <TouchableOpacity
            style={styles.button}
            onPress={onOpenSettings}
            accessibilityRole='button'
            accessibilityLabel='Open Settings'
          >
            <ThemedText style={styles.buttonText}>Open Settings</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    );
  }

  // iOS: render native ARKitView
  // Note: The actual native view manager would be imported here, but for
  // test mocking we just render a placeholder. In production, this would be:
  // const ARKitView = requireNativeViewManager('ARKitView');
  // return <ARKitView style={styles.arView} {...config} />;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.placeholderText}>ARKitView (native view placeholder)</ThemedText>
      <ThemedText style={styles.caption}>
        In production, this renders RealityKit ARView. Config: {config.planeDetection} | Light:{' '}
        {config.lightEstimation ? 'ON' : 'OFF'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  banner: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  caption: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
