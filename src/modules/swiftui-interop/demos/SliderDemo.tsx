/**
 * @file SliderDemo.tsx
 * @description iOS SwiftUI Slider demo (T016)
 * Shows real SwiftUI Slider with RN bar echo
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Host, Slider, RNHostView } from '@expo/ui/swift-ui';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SliderDemo() {
  const [value, setValue] = useState<number>(50);
  const theme = useTheme();

  return (
    <ThemedView testID="slider-demo" style={styles.container}>
      <ThemedText type="smallBold">SwiftUI Slider</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        Real SwiftUI Slider with React Native bar width echo
      </ThemedText>

      <View style={styles.demoRow}>
        <Host matchContents>
          <Slider
            value={value}
            min={0}
            max={100}
            onValueChange={(newValue: number) => setValue(Math.round(newValue))}
            label="Adjust slider"
          />
        </Host>

        <RNHostView matchContents>
          <ThemedView type="backgroundElement" style={styles.barContainer}>
            <ThemedView
              testID="slider-bar"
              style={[
                styles.bar,
                {
                  width: `${value}%`, // Dynamic value - permitted by constitution
                  backgroundColor: theme.tintA,
                },
              ]}
            />
            <ThemedText type="small" style={styles.barLabel}>
              {value}%
            </ThemedText>
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
  barContainer: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bar: {
    height: 8,
    borderRadius: Spacing.half,
  },
  barLabel: {
    minWidth: 40,
  },
});
