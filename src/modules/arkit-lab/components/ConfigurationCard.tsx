/**
 * ConfigurationCard Component
 * Feature: 034-arkit-basics
 *
 * Controls for plane detection (segmented), peopleOcclusion (gated by support),
 * lightEstimation, worldMapPersistence (v1 placeholder), and Reset button.
 * Disabled on Android/Web with explanatory caption.
 */

import React from 'react';
import { StyleSheet, View, Platform, Switch, TouchableOpacity } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { PLANE_DETECTION_MODES } from '../plane-detection-modes';
import type { ARKitConfiguration, PlaneDetectionMode } from '@/native/arkit.types';

interface ConfigurationCardProps {
  readonly config: ARKitConfiguration;
  readonly peopleOcclusionSupported: boolean;
  readonly onChange: (delta: Partial<ARKitConfiguration>) => void;
  readonly onReset: () => void;
}

export default function ConfigurationCard({
  config,
  peopleOcclusionSupported,
  onChange,
  onReset,
}: ConfigurationCardProps) {
  const isDisabled = Platform.OS !== 'ios';

  return (
    <ThemedView
      style={styles.container}
      accessibilityLabel="Configuration"
      accessibilityState={{ disabled: isDisabled }}
    >
      <ThemedText style={styles.title}>Configuration</ThemedText>

      {isDisabled && (
        <ThemedText style={styles.disabledCaption}>
          iOS only — controls are disabled on this platform
        </ThemedText>
      )}

      {/* Plane Detection Segmented Control */}
      <ThemedText style={styles.label}>Plane Detection</ThemedText>
      <View style={styles.segmentedControl}>
        {PLANE_DETECTION_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.segment,
              config.planeDetection === mode.value && styles.segmentSelected,
            ]}
            onPress={() => !isDisabled && onChange({ planeDetection: mode.value })}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={mode.label}
          >
            <ThemedText
              style={[
                styles.segmentText,
                config.planeDetection === mode.value && styles.segmentTextSelected,
              ]}
            >
              {mode.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* People Occlusion Switch */}
      <View
        style={styles.switchRow}
        accessibilityLabel="People Occlusion"
        accessibilityState={{ disabled: !peopleOcclusionSupported || isDisabled }}
      >
        <ThemedText style={styles.label}>People Occlusion</ThemedText>
        <Switch
          value={config.peopleOcclusion}
          onValueChange={(value) => onChange({ peopleOcclusion: value })}
          disabled={!peopleOcclusionSupported || isDisabled}
        />
      </View>
      {!peopleOcclusionSupported && (
        <ThemedText style={styles.caption}>
          Requires iOS 13+ with LiDAR (not supported on this device)
        </ThemedText>
      )}

      {/* Light Estimation Switch */}
      <View
        style={styles.switchRow}
        accessibilityLabel="Light Estimation"
        accessibilityState={{ disabled: isDisabled }}
      >
        <ThemedText style={styles.label}>Light Estimation</ThemedText>
        <Switch
          value={config.lightEstimation}
          onValueChange={(value) => onChange({ lightEstimation: value })}
          disabled={isDisabled}
        />
      </View>

      {/* World Map Persistence Switch (v1 placeholder) */}
      <View
        style={styles.switchRow}
        accessibilityLabel="World Map Persistence"
        accessibilityState={{ disabled: isDisabled }}
      >
        <ThemedText style={styles.label}>World Map Persistence</ThemedText>
        <Switch
          value={config.worldMapPersistence}
          onValueChange={(value) => onChange({ worldMapPersistence: value })}
          disabled={isDisabled}
        />
      </View>
      <ThemedText style={styles.caption}>
        v1 placeholder — session-scoped only (no on-disk persistence)
      </ThemedText>

      {/* Reset Button */}
      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={onReset}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel="Reset"
      >
        <ThemedText style={styles.buttonText}>Reset</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  disabledCaption: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: Spacing.two,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.one,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: Spacing.one,
    borderRadius: Spacing.one,
  },
  segmentSelected: {
    backgroundColor: '#007AFF',
  },
  segmentText: {
    fontSize: 12,
    color: '#007AFF',
  },
  segmentTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  caption: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: Spacing.two,
  },
  button: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
