/**
 * RenderingModePicker — three-segment picker for `RenderingMode`.
 *
 * Selected state expressed via accessibilityState.selected. Tap on the
 * already-selected segment is a no-op (idempotent UI).
 *
 * @see specs/028-standby-mode/tasks.md T023, T030
 * @see specs/028-standby-mode/spec.md FR-SB-031, NFR-SB-007
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { RENDERING_MODES, type RenderingMode } from '@/modules/standby-lab/standby-config';

const MODE_LABELS: Readonly<Record<RenderingMode, string>> = {
  fullColor: 'Full Color',
  accented: 'Accented',
  vibrant: 'Vibrant',
};

export interface RenderingModePickerProps {
  readonly value: RenderingMode;
  readonly onChange: (mode: RenderingMode) => void;
}

export function RenderingModePicker({ value, onChange }: RenderingModePickerProps) {
  return (
    <View style={styles.row} accessibilityRole='radiogroup'>
      {RENDERING_MODES.map((mode) => {
        const selected = mode === value;
        return (
          <Pressable
            key={mode}
            accessibilityLabel={`Rendering mode ${MODE_LABELS[mode]}`}
            accessibilityRole='radio'
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                onChange(mode);
              }
            }}
            style={[styles.segment, selected ? styles.segmentSelected : styles.segmentIdle]}
          >
            <ThemedText style={[styles.label, selected && styles.labelSelected]}>
              {MODE_LABELS[mode]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentIdle: {
    borderColor: '#D0D1D6',
    backgroundColor: 'transparent',
  },
  segmentSelected: {
    borderColor: '#000',
    backgroundColor: '#1F1F22',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
