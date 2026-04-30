/**
 * LiveStatusCard — LiDAR / RoomPlan Lab (feature 048).
 *
 * Renders the current scan phase plus contextual instructions.
 * Pure presentational.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ScanPhase } from '@/native/roomplan.types';

interface LiveStatusCardProps {
  readonly style?: ViewStyle;
  readonly phase: ScanPhase;
  readonly errorMessage?: string | null;
}

export function instructionFor(phase: ScanPhase): string {
  switch (phase) {
    case 'scanning':
      return 'Move slowly around the room. Keep the device pointed at walls and doorways. Avoid reflective surfaces.';
    case 'processing':
      return 'Scanning complete. Generating the parametric model — this usually takes a few seconds.';
    case 'completed':
      return 'Capture finished. The room appears below; tap Export USDZ to share the 3D asset.';
    case 'error':
      return 'The capture session reported an error. Tap Start scan to try again.';
    case 'idle':
    default:
      return 'Idle. Tap Start scan to launch the system RoomCaptureView.';
  }
}

export function phaseGlyph(phase: ScanPhase): string {
  switch (phase) {
    case 'scanning':
      return '🟢';
    case 'processing':
      return '🟡';
    case 'completed':
      return '🔵';
    case 'error':
      return '🔴';
    case 'idle':
    default:
      return '⚫';
  }
}

export default function LiveStatusCard({ style, phase, errorMessage }: LiveStatusCardProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="roomplan-live-status-card"
    >
      <ThemedText type="smallBold">Live status</ThemedText>
      <ThemedText type="default" testID="roomplan-phase-pill">
        {phaseGlyph(phase)} {phase}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" testID="roomplan-instruction">
        {instructionFor(phase)}
      </ThemedText>
      {errorMessage ? (
        <ThemedText type="small" themeColor="tintB" testID="roomplan-error-message">
          {errorMessage}
        </ThemedText>
      ) : null}
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
