/**
 * @file PickerDemo.tsx
 * @description iOS SwiftUI Picker demo (T013)
 * Shows real SwiftUI Picker with RN echo
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Host, Picker, RNHostView } from '@expo/ui/swift-ui';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const OPTIONS = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'date', label: 'Date' },
] as const;

export function PickerDemo() {
  const [selected, setSelected] = useState<string>(OPTIONS[0].id);

  const selectedLabel = OPTIONS.find((opt) => opt.id === selected)?.label ?? 'Unknown';

  return (
    <ThemedView testID="picker-demo" style={styles.container}>
      <ThemedText type="smallBold">SwiftUI Picker</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        Real SwiftUI Picker control with React Native echo
      </ThemedText>

      <View style={styles.demoRow}>
        <Host matchContents>
          <Picker
            selection={selected}
            onSelectionChange={(value: string) => setSelected(value)}
            label="Choose fruit"
          >
            {OPTIONS.map((opt) => (
              <Text key={opt.id}>{opt.label}</Text>
            ))}
          </Picker>
        </Host>

        <RNHostView matchContents>
          <ThemedView type="backgroundElement" style={styles.echo}>
            <ThemedText type="small">Selected: {selectedLabel}</ThemedText>
          </ThemedView>
        </RNHostView>
      </View>
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
  demoRow: {
    gap: Spacing.two,
  },
  swiftUIContainer: {
    minHeight: 44,
  },
  echoContainer: {
    minHeight: 44,
  },
  echo: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
});
