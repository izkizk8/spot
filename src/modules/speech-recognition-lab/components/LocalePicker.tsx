/**
 * LocalePicker — top-6 locale selector (US1 baseline, T039).
 *
 * US1: renders a tappable list of locales with the current selection.
 * US3 will add system-locale resolution + bridge.isAvailable validation.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Locale } from '@/modules/speech-recognition-lab/speech-types';
import { TOP_LOCALES } from '@/modules/speech-recognition-lab/speech-types';

export interface LocalePickerProps {
  locale: Locale;
  availableLocales?: Locale[];
  onLocaleChange: (locale: Locale) => void;
  disabled?: boolean;
}

export default function LocalePicker({
  locale,
  availableLocales,
  onLocaleChange,
  disabled = false,
}: LocalePickerProps) {
  // Always render the top-6 list. When `availableLocales` is provided,
  // chips not in that list render disabled (US3 / FR-008).
  const filterSet =
    availableLocales && availableLocales.length > 0 ? new Set(availableLocales) : null;

  return (
    <ThemedView type="background" style={styles.container} accessibilityLabel="Locale picker">
      <ThemedText type="small" themeColor="textSecondary" style={styles.heading}>
        Locale
      </ThemedText>
      <View style={styles.row}>
        {TOP_LOCALES.map((loc) => {
          const isSelected = loc === locale;
          const isUnsupported = filterSet ? !filterSet.has(loc) : false;
          const chipDisabled = disabled || isUnsupported;
          return (
            <Pressable
              key={loc}
              onPress={() => {
                if (chipDisabled) return;
                onLocaleChange(loc);
              }}
              disabled={chipDisabled}
              accessibilityRole="button"
              accessibilityLabel={`Select locale ${loc}`}
              accessibilityState={{ selected: isSelected, disabled: chipDisabled }}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                chipDisabled && styles.chipDisabled,
              ]}
            >
              <ThemedText type="small" themeColor={isSelected ? 'tintA' : 'text'}>
                {loc}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
  },
  chipSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.18)',
  },
  chipDisabled: {
    opacity: 0.4,
  },
});
