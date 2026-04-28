/**
 * StandByConfigPanel — the StandBy module's configuration panel.
 *
 * FALLBACK: research §5 — local copy of 014's three-control panel
 * (showcase, counter, tint) extended with the RenderingModePicker.
 * Composing 014's ConfigPanel verbatim is structurally incompatible
 * with the added `mode` field on StandByConfig, so the local-copy
 * fallback path is the chosen route (R-C).
 *
 * @see specs/028-standby-mode/tasks.md T022, T029
 * @see specs/028-standby-mode/spec.md FR-SB-028, FR-SB-031, FR-SB-027
 */

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { TINT_HEX } from '@/modules/widgets-lab/tints';
import { TINTS, type Tint } from '@/modules/widgets-lab/widget-config';
import {
  type StandByConfig,
  type RenderingMode,
  validate,
} from '@/modules/standby-lab/standby-config';
import { RenderingModePicker } from './RenderingModePicker';

export interface StandByConfigPanelProps {
  readonly value: StandByConfig;
  readonly onPush: (config: StandByConfig) => void | Promise<void>;
  readonly pushEnabled: boolean;
  readonly disabledPushReason?: string;
  /**
   * Fires on every local edit (debounce-free). Lets the parent reflect
   * the draft in a live preview / shadow-persist edits regardless of
   * whether the Push button is enabled.
   */
  readonly onChange?: (draft: StandByConfig) => void;
}

export function StandByConfigPanel({
  value,
  onPush,
  pushEnabled,
  disabledPushReason,
  onChange,
}: StandByConfigPanelProps) {
  const [showcaseValue, setShowcaseValue] = useState(value.showcaseValue);
  const [counterText, setCounterText] = useState(String(value.counter));
  const [tint, setTint] = useState<Tint>(value.tint);
  const [mode, setMode] = useState<RenderingMode>(value.mode);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!onChangeRef.current) return;
    const counterNum = parseInt(counterText, 10);
    const counter = Number.isFinite(counterNum) ? counterNum : 0;
    onChangeRef.current(validate({ showcaseValue: showcaseValue.trim(), counter, tint, mode }));
  }, [showcaseValue, counterText, tint, mode]);

  const trimmed = showcaseValue.trim();
  const canPush = pushEnabled && trimmed.length > 0;

  const handlePush = async (): Promise<void> => {
    if (!canPush) return;
    const counterNum = parseInt(counterText, 10);
    const counter = Number.isFinite(counterNum) ? counterNum : 0;
    const next = validate({ showcaseValue: trimmed, counter, tint, mode });
    await onPush(next);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>StandBy widget config</ThemedText>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Showcase value</ThemedText>
        <TextInput
          accessibilityLabel="Showcase value"
          value={showcaseValue}
          onChangeText={setShowcaseValue}
          placeholder="StandBy"
          placeholderTextColor="#888"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Counter</ThemedText>
        <TextInput
          accessibilityLabel="Counter"
          value={counterText}
          onChangeText={setCounterText}
          keyboardType="numbers-and-punctuation"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Tint</ThemedText>
        <View
          accessibilityLabel="Tint picker"
          accessibilityRole="radiogroup"
          style={styles.swatchRow}
        >
          {TINTS.map((t) => (
            <Pressable
              key={t}
              accessibilityLabel={`Tint ${t}`}
              accessibilityRole="radio"
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

      <View style={styles.field}>
        <ThemedText style={styles.label}>Rendering mode</ThemedText>
        <RenderingModePicker value={mode} onChange={setMode} />
      </View>

      <Pressable
        accessibilityLabel="Push to StandBy widget"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canPush }}
        onPress={handlePush}
        disabled={!canPush}
        style={[styles.pushButton, !canPush && styles.pushButtonDisabled]}
      >
        <ThemedText style={styles.pushButtonText}>Push to StandBy widget</ThemedText>
      </Pressable>

      {!pushEnabled && disabledPushReason ? (
        <ThemedText style={styles.disabledReason} accessibilityLabel="Push disabled reason">
          {disabledPushReason}
        </ThemedText>
      ) : null}
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
  disabledReason: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
