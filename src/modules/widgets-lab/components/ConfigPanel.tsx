/**
 * ConfigPanel — three controls (showcaseValue / counter / tint) + Push button.
 *
 * Validates input on Push:
 *  - trims `showcaseValue`; disables Push when empty (Edge Case in spec).
 *  - clamps `counter` to [-9999, 9999] (FR-026).
 *  - tint constrained by the swatch picker to one of TINTS.
 *
 * Pure presentation: parent owns config state via the `value` prop. Local
 * state covers in-flight edits not yet pushed (RN-controlled inputs).
 *
 * @see specs/014-home-widgets/tasks.md T022
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { TINT_HEX } from '@/modules/widgets-lab/tints';
import { TINTS, type Tint, type WidgetConfig, validate } from '@/modules/widgets-lab/widget-config';

export interface ConfigPanelProps {
  /** Initial / authoritative configuration. Parent should pass a stable
   *  `key` whenever it wants the panel to reset to a new initial value
   *  (e.g. after `bridge.getCurrentConfig` resolves). */
  readonly value: WidgetConfig;
  readonly onPush: (config: WidgetConfig) => void | Promise<void>;
  /** When false, Push button is rendered disabled regardless of input. */
  readonly pushEnabled: boolean;
}

export function ConfigPanel({ value, onPush, pushEnabled }: ConfigPanelProps) {
  // Local in-flight editing state, seeded from the prop on mount only.
  // Parent re-mounts via `key` to seed a fresh value (see screen.tsx).
  const [showcaseValue, setShowcaseValue] = useState(value.showcaseValue);
  const [counterText, setCounterText] = useState(String(value.counter));
  const [tint, setTint] = useState<Tint>(value.tint);

  const trimmed = showcaseValue.trim();
  const canPush = pushEnabled && trimmed.length > 0;

  const handlePush = async (): Promise<void> => {
    if (!canPush) return;
    const counterNum = parseInt(counterText, 10);
    const counter = Number.isFinite(counterNum) ? counterNum : 0;
    const next = validate({ showcaseValue: trimmed, counter, tint });
    await onPush(next);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Widget config</ThemedText>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Showcase value</ThemedText>
        <TextInput
          accessibilityLabel='Showcase value'
          value={showcaseValue}
          onChangeText={setShowcaseValue}
          placeholder='Hello, Widget!'
          placeholderTextColor='#888'
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Counter</ThemedText>
        <TextInput
          accessibilityLabel='Counter'
          value={counterText}
          onChangeText={setCounterText}
          keyboardType='numbers-and-punctuation'
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Tint</ThemedText>
        <View
          accessibilityLabel='Tint picker'
          accessibilityRole='radiogroup'
          style={styles.swatchRow}
        >
          {TINTS.map((t) => (
            <Pressable
              key={t}
              accessibilityLabel={`Tint ${t}`}
              accessibilityRole='radio'
              accessibilityState={{ selected: tint === t }}
              onPress={() => setTint(t)}
              style={[
                styles.swatch,
                { backgroundColor: TINT_HEX[t] },
                tint === t ? styles.swatchSelected : null,
              ]}
            />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityLabel='Push to widget'
        accessibilityRole='button'
        accessibilityState={{ disabled: !canPush }}
        onPress={handlePush}
        disabled={!canPush}
        style={[styles.pushButton, !canPush && styles.pushButtonDisabled]}
      >
        <ThemedText style={styles.pushButtonText}>Push to widget</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
  },
  field: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#D0D1D6',
    color: '#000',
    backgroundColor: '#FFFFFF',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#000',
  },
  pushButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  pushButtonDisabled: {
    opacity: 0.4,
  },
  pushButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
