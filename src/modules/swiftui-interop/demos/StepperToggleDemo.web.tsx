/**
 * @file StepperToggleDemo.web.tsx
 * @description Web RN fallback for StepperToggleDemo (T040)
 * Same buttons + Switch as Android
 */

import React, { useState } from 'react';
import { StyleSheet, Pressable, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function StepperToggleDemo() {
  const [count, setCount] = useState<number>(0);
  const [enabled, setEnabled] = useState<boolean>(false);
  const theme = useTheme();

  return (
    <ThemedView testID="stepper-toggle-demo" style={styles.container}>
      <ThemedText type="smallBold">Web Stepper + Toggle Fallback</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        RN-Web fallback: Pressable buttons + Switch
      </ThemedText>

      <ThemedView style={styles.controls}>
        <ThemedView style={styles.stepper}>
          <Pressable
            onPress={() => setCount(Math.max(0, count - 1))}
            accessibilityRole="button"
          >
            <ThemedView type="backgroundSelected" style={styles.button}>
              <ThemedText type="small">−</ThemedText>
            </ThemedView>
          </Pressable>
          <ThemedText type="small" style={styles.countLabel}>
            {count}
          </ThemedText>
          <Pressable
            onPress={() => setCount(Math.min(10, count + 1))}
            accessibilityRole="button"
          >
            <ThemedView type="backgroundSelected" style={styles.button}>
              <ThemedText type="small">+</ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: theme.backgroundElement, true: theme.tintA }}
          thumbColor="#fff"
        />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.echo}>
        <ThemedText type="small">
          Count: {count} • Status: {enabled ? 'on' : 'off'}
        </ThemedText>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLabel: {
    minWidth: 24,
    textAlign: 'center',
  },
  echo: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
});
