/**
 * @file StepperToggleDemo.tsx
 * @description iOS SwiftUI Stepper + Toggle demo (T017)
 * Shows real SwiftUI Stepper and Toggle with RN echo
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Host, Stepper, Toggle, RNHostView } from '@expo/ui/swift-ui';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function StepperToggleDemo() {
  const [count, setCount] = useState<number>(0);
  const [enabled, setEnabled] = useState<boolean>(false);

  return (
    <ThemedView testID="stepper-toggle-demo" style={styles.container}>
      <ThemedText type="smallBold">SwiftUI Stepper + Toggle</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        Real SwiftUI Stepper and Toggle with React Native echo
      </ThemedText>

      <View style={styles.demoRow}>
        <Host matchContents>
          <Stepper
            value={count}
            min={0}
            max={10}
            step={1}
            onValueChange={(value: number) => setCount(value)}
            label="Count"
          />
        </Host>

        <Host matchContents>
          <Toggle
            isOn={enabled}
            onIsOnChange={(value: boolean) => setEnabled(value)}
            label="Enabled"
          />
        </Host>

        <RNHostView matchContents>
          <ThemedView type="backgroundElement" style={styles.echo}>
            <ThemedText type="small">
              Count: {count} • Status: {enabled ? 'on' : 'off'}
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
  echo: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
});
