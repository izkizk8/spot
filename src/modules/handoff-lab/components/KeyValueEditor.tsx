/**
 * KeyValueEditor — feature 040 / T028 / US2.
 *
 * Controlled editor for ordered { key, value } string rows.
 * Surfaces a duplicate-key error string but does not enforce uniqueness
 * (parent decides whether to gate submission).
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface KeyValueRow {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  readonly rows: readonly KeyValueRow[];
  readonly onChange: (next: KeyValueRow[]) => void;
  readonly style?: ViewStyle;
}

export function findDuplicateKey(rows: readonly KeyValueRow[]): string | null {
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.key.length === 0) continue;
    if (seen.has(row.key)) return row.key;
    seen.add(row.key);
  }
  return null;
}

export default function KeyValueEditor({ rows, onChange, style }: KeyValueEditorProps) {
  const theme = useTheme();
  const duplicate = findDuplicateKey(rows);

  const updateRow = (index: number, patch: Partial<KeyValueRow>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { key: '', value: '' }]);
  };

  const inputStyle: TextStyle = {
    color: theme.text,
    borderColor: theme.backgroundSelected,
    backgroundColor: theme.backgroundElement,
  };

  return (
    <ThemedView style={[styles.container, style]}>
      {rows.map((row, index) => (
        <View key={index} style={styles.row}>
          <TextInput
            style={[styles.input, inputStyle]}
            value={row.key}
            onChangeText={(text) => updateRow(index, { key: text })}
            placeholder="key"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, inputStyle]}
            value={row.value}
            onChangeText={(text) => updateRow(index, { value: text })}
            placeholder="value"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => removeRow(index)} style={styles.removeBtn}>
            <ThemedText type="small" themeColor="tintB">
              Remove
            </ThemedText>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addRow} style={styles.addBtn}>
        <ThemedText type="smallBold" themeColor="tintA">
          + Add row
        </ThemedText>
      </Pressable>
      {duplicate !== null ? (
        <ThemedText type="small" themeColor="tintB" style={styles.error}>
          duplicate key: {duplicate}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
  },
  removeBtn: {
    padding: Spacing.one,
  },
  addBtn: {
    paddingVertical: Spacing.one,
  },
  error: {
    fontStyle: 'italic',
  },
});
