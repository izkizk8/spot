/**
 * CharacteristicEditor — HomeKit Lab (feature 044).
 *
 * Renders the appropriate writer for the currently-selected
 * characteristic: a Switch for `bool`, percent segments for
 * `percent`, a picker for `enum`, and a read-only display when
 * the characteristic is not writable.
 */

import React from 'react';
import { Pressable, StyleSheet, Switch, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { CharacteristicRecord, CharacteristicValue } from '@/native/homekit.types';
import { PERCENT_SEGMENTS, formatValue } from '../characteristic-types';

interface CharacteristicEditorProps {
  readonly characteristic: CharacteristicRecord | null;
  readonly currentValue: CharacteristicValue | null;
  readonly onWrite: (value: CharacteristicValue) => void;
  readonly onRead: () => void;
  readonly style?: ViewStyle;
}

export default function CharacteristicEditor({
  characteristic,
  currentValue,
  onWrite,
  onRead,
  style,
}: CharacteristicEditorProps) {
  const theme = useTheme();

  if (!characteristic) {
    return (
      <ThemedView style={[styles.container, style]} testID='homekit-editor-card'>
        <ThemedText style={styles.heading}>Characteristic editor</ThemedText>
        <ThemedText type='small' themeColor='textSecondary' testID='homekit-editor-empty'>
          Select a characteristic from an accessory to read or write its value.
        </ThemedText>
      </ThemedView>
    );
  }

  const display = formatValue(characteristic.kind, currentValue, characteristic.options);

  return (
    <ThemedView style={[styles.container, style]} testID='homekit-editor-card'>
      <ThemedText style={styles.heading}>Characteristic editor</ThemedText>
      <ThemedText type='smallBold' testID='homekit-editor-name'>
        {characteristic.name}
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary' testID='homekit-editor-value'>
        Current value: {display}
      </ThemedText>

      {characteristic.kind === 'bool' ? (
        <View style={styles.row}>
          <ThemedText type='small'>Toggle</ThemedText>
          <Switch
            testID='homekit-editor-bool'
            value={!!currentValue}
            onValueChange={(v) => onWrite(v)}
            disabled={!characteristic.writable}
          />
        </View>
      ) : null}

      {characteristic.kind === 'percent' ? (
        <View style={styles.segments}>
          {PERCENT_SEGMENTS.map((seg) => {
            const active = typeof currentValue === 'number' && currentValue === seg;
            return (
              <Pressable
                key={seg}
                testID={`homekit-editor-percent-${seg}`}
                onPress={() => onWrite(seg)}
                disabled={!characteristic.writable}
                style={[
                  styles.segment,
                  {
                    backgroundColor: active ? theme.tintA : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText type='small' themeColor={active ? 'background' : 'text'}>
                  {seg}%
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {characteristic.kind === 'enum' ? (
        <View style={styles.segments}>
          {(characteristic.options ?? []).map((option) => {
            const active = currentValue === option.value;
            return (
              <Pressable
                key={option.value}
                testID={`homekit-editor-enum-${option.value}`}
                onPress={() => onWrite(option.value)}
                disabled={!characteristic.writable}
                style={[
                  styles.segment,
                  {
                    backgroundColor: active ? theme.tintA : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText type='small' themeColor={active ? 'background' : 'text'}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Pressable
        testID='homekit-editor-read'
        onPress={onRead}
        style={[styles.cta, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText type='smallBold'>Read current value</ThemedText>
      </Pressable>

      {!characteristic.writable ? (
        <ThemedText type='small' themeColor='tintB' testID='homekit-editor-readonly'>
          This characteristic is read-only.
        </ThemedText>
      ) : null}
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
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
  },
  segments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  segment: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  cta: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
});
