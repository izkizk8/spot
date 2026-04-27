/**
 * @file PickerDemo.web.tsx
 * @description Web RN fallback for PickerDemo (T036)
 * Same as Android - segmented chip row
 */

import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OPTIONS = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'date', label: 'Date' },
] as const;

export function PickerDemo() {
  const [selected, setSelected] = useState<string>(OPTIONS[0].id);
  const theme = useTheme();

  const selectedLabel = OPTIONS.find((opt) => opt.id === selected)?.label ?? 'Unknown';

  return (
    <ThemedView testID="picker-demo" style={styles.container}>
      <ThemedText type="smallBold">Web Picker Fallback</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        RN-Web fallback for SwiftUI Picker
      </ThemedText>

      <ThemedView style={styles.chipRow}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => setSelected(opt.id)}
            role="button"
            style={[
              styles.chip,
              {
                backgroundColor:
                  selected === opt.id ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText type="small">{opt.label}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.echo}>
        <ThemedText type="small">Selected: {selectedLabel}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  caption: {
    marginBottom: Spacing.one,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  echo: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
});
