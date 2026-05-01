/**
 * Generic 3-segment preset control (US3, T042/T043/T044).
 *
 * Used by RateControl / PitchControl / VolumeControl below. Pure UI; no
 * synth-mapping math here — the screen translates the preset enum to an
 * iOS-domain number via `synth-mapping.ts` immediately before `bridge.speak`.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  segments: ReadonlyArray<T>;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export default function SegmentedControl<T extends string>({
  label,
  value,
  segments,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <ThemedView type='background' style={styles.container} accessibilityLabel={label}>
      <ThemedText type='small' themeColor='textSecondary' style={styles.heading}>
        {label}
      </ThemedText>
      <ThemedView type='backgroundElement' style={styles.row}>
        {segments.map((seg) => {
          const isSelected = seg === value;
          return (
            <Pressable
              key={seg}
              onPress={() => {
                if (disabled) return;
                onChange(seg);
              }}
              disabled={disabled}
              accessibilityRole='button'
              accessibilityLabel={`${label}: ${seg}`}
              accessibilityState={{ selected: isSelected, disabled }}
              style={[
                styles.segment,
                isSelected && { backgroundColor: theme.backgroundSelected },
                disabled && styles.disabled,
              ]}
            >
              <ThemedText type='smallBold' themeColor={isSelected ? 'tintA' : 'text'}>
                {seg}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  heading: {
    marginBottom: Spacing.half,
  },
  row: {
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
  disabled: {
    opacity: 0.4,
  },
});
