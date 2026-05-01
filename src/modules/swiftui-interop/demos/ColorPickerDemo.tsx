/**
 * @file ColorPickerDemo.tsx
 * @description iOS SwiftUI ColorPicker demo (T014)
 * Shows real SwiftUI ColorPicker with RN swatch echo
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Host, ColorPicker, RNHostView } from '@expo/ui/swift-ui';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Normalizes SwiftUI color value to RN-compatible string.
 * Accepts hex (#rrggbb), rgba(r,g,b,a), or returns default.
 */
function toRNColor(value: string | unknown): string {
  if (typeof value === 'string') {
    if (value.startsWith('#') || value.startsWith('rgb')) {
      return value;
    }
  }
  return '#007AFF'; // iOS blue default
}

export function ColorPickerDemo() {
  const [color, setColor] = useState<string>('#FF6B35');

  return (
    <ThemedView testID='color-picker-demo' style={styles.container}>
      <ThemedText type='smallBold'>SwiftUI ColorPicker</ThemedText>
      <ThemedText type='small' themeColor='textSecondary' style={styles.caption}>
        Real SwiftUI ColorPicker with React Native swatch
      </ThemedText>

      <View style={styles.demoRow}>
        <Host matchContents>
          <ColorPicker
            selection={color}
            onSelectionChange={(value: string) => setColor(toRNColor(value))}
            label='Pick a color'
          />
        </Host>

        <RNHostView matchContents>
          <ThemedView
            testID='color-swatch'
            style={[
              styles.swatch,
              {
                backgroundColor: color, // Dynamic value - permitted by constitution
              },
            ]}
          />
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
  swatch: {
    width: 60,
    height: 44,
    borderRadius: Spacing.one,
  },
});
