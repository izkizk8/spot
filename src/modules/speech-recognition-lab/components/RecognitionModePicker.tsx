/**
 * RecognitionModePicker — Server / On-device segmented control (US1 baseline, T038).
 *
 * US1: always renders both segments; tapping invokes onModeChange.
 * US2 will add full disabled-segment + accessibility behavior for !onDeviceAvailable.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { RecognitionMode } from '@/modules/speech-recognition-lab/speech-types';

export interface RecognitionModePickerProps {
  mode: RecognitionMode;
  onDeviceAvailable: boolean;
  onModeChange: (mode: RecognitionMode) => void;
  disabled?: boolean;
}

const SEGMENTS: Array<{ value: RecognitionMode; label: string }> = [
  { value: 'server', label: 'Server' },
  { value: 'on-device', label: 'On-device' },
];

export default function RecognitionModePicker({
  mode,
  onDeviceAvailable,
  onModeChange,
  disabled = false,
}: RecognitionModePickerProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {SEGMENTS.map((s) => {
        const isSelected = s.value === mode;
        const isOnDeviceUnavailable = s.value === 'on-device' && !onDeviceAvailable;
        const segmentDisabled = disabled || isOnDeviceUnavailable;
        const accessibilityLabel = isOnDeviceUnavailable
          ? 'On-device recognition not available for this locale on this device'
          : `Recognition mode: ${s.label}`;
        return (
          <Pressable
            key={s.value}
            onPress={() => {
              if (segmentDisabled) return;
              onModeChange(s.value);
            }}
            disabled={segmentDisabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected: isSelected, disabled: segmentDisabled }}
            style={[
              styles.segment,
              isSelected && styles.segmentSelected,
              segmentDisabled && styles.segmentDisabled,
            ]}
          >
            <ThemedText type="smallBold" themeColor={isSelected ? 'tintA' : 'text'}>
              {s.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Spacing.one,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  segmentDisabled: {
    opacity: 0.4,
  },
});
