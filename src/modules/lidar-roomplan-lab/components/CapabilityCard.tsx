/**
 * CapabilityCard — LiDAR / RoomPlan Lab (feature 048).
 *
 * Renders the `RoomCaptureSession.isSupported` capability and a
 * snapshot of the current scan phase. LiDAR-only — every
 * non-LiDAR device (and every non-iOS platform) reports
 * `supported: false`. Pure presentational + controlled.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ScanPhase } from '@/native/roomplan.types';

interface CapabilityCardProps {
  readonly style?: ViewStyle;
  readonly supported: boolean;
  readonly phase: ScanPhase;
}

export default function CapabilityCard({ style, supported, phase }: CapabilityCardProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='roomplan-capability-card'
    >
      <ThemedText type='smallBold'>RoomPlan capability</ThemedText>
      <ThemedText type='small' testID='roomplan-capability-supported'>
        {supported
          ? '✅ RoomCaptureSession is supported (LiDAR detected).'
          : '⛔ RoomCaptureSession is unavailable. RoomPlan requires a device with a LiDAR scanner.'}
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary' testID='roomplan-capability-phase'>
        Scan phase: {phase}
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
});
