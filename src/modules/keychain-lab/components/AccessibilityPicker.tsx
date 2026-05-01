/**
 * AccessibilityPicker — picks a `kSecAttrAccessible*` class for new items.
 *
 * Renders all five classes from `accessibility-classes.ts` with their
 * plain-language descriptions. On Android the picker is disabled with a
 * one-line note that the full keychain flow is iOS-only.
 *
 * Covers FR-017, US3-AS1, US5-AS2.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ACCESSIBILITY_CLASSES, type AccessibilityClass } from '../accessibility-classes';

interface AccessibilityPickerProps {
  value: AccessibilityClass;
  onChange: (next: AccessibilityClass) => void;
}

export default function AccessibilityPicker({ value, onChange }: AccessibilityPickerProps) {
  const theme = useTheme();
  const disabled = Platform.OS === 'android';

  return (
    <ThemedView style={styles.container} type='backgroundElement'>
      <ThemedText type='smallBold' style={styles.heading}>
        Accessibility class
      </ThemedText>

      {disabled && (
        <ThemedText type='small' themeColor='textSecondary' style={styles.note}>
          Picker is iOS-only — the full keychain flow is not available on Android.
        </ThemedText>
      )}

      {ACCESSIBILITY_CLASSES.map((descriptor) => {
        const selected = descriptor.key === value;
        return (
          <Pressable
            key={descriptor.key}
            testID={`accessibility-option-${descriptor.key}`}
            accessibilityRole='radio'
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(descriptor.key)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? theme.backgroundSelected : theme.background,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <ThemedView style={styles.optionLabelRow} type='backgroundElement'>
              <ThemedText type='default' style={styles.optionGlyph}>
                {selected ? '◉' : '○'}
              </ThemedText>
              <ThemedText type='default' style={styles.optionLabel}>
                {descriptor.label}
              </ThemedText>
            </ThemedView>
            <ThemedText type='small' themeColor='textSecondary' style={styles.optionDescription}>
              {descriptor.description}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    marginBottom: Spacing.one,
  },
  note: {
    marginBottom: Spacing.two,
    lineHeight: 18,
  },
  option: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  optionGlyph: {
    width: 16,
  },
  optionLabel: {
    fontWeight: '600',
  },
  optionDescription: {
    marginTop: Spacing.half,
    lineHeight: 18,
  },
});
