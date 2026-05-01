/**
 * SummaryItemsEditor — Apple Pay Lab (feature 049).
 *
 * Controlled list editor: add a row, edit label / amount, remove
 * a row. Pure presentational; no native imports.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SummaryItem } from '@/native/applepay.types';

import { isValidAmount, totalAmount } from '../supported-networks';

interface SummaryItemsEditorProps {
  readonly style?: ViewStyle;
  readonly items: readonly SummaryItem[];
  readonly onChange: (next: readonly SummaryItem[]) => void;
}

export default function SummaryItemsEditor({ style, items, onChange }: SummaryItemsEditorProps) {
  const theme = useTheme();
  const [draftLabel, setDraftLabel] = useState('');
  const [draftAmount, setDraftAmount] = useState('');

  const addItem = useCallback(() => {
    if (draftLabel.trim().length === 0) return;
    if (!isValidAmount(draftAmount)) return;
    onChange([...items, { label: draftLabel.trim(), amount: draftAmount }]);
    setDraftLabel('');
    setDraftAmount('');
  }, [draftAmount, draftLabel, items, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      const next = items.filter((_, i) => i !== index);
      onChange(next);
    },
    [items, onChange],
  );

  const updateItem = useCallback(
    (index: number, patch: Partial<SummaryItem>) => {
      const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
      onChange(next);
    },
    [items, onChange],
  );

  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='apple-pay-summary-items-editor'
    >
      <ThemedText type='smallBold'>Summary items</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        The last item shown on the Apple Pay sheet is the total. Computed sum: ${totalAmount(items)}
        .
      </ThemedText>
      {items.map((it, idx) => (
        <View key={`${idx}-${it.label}`} style={styles.row}>
          <TextInput
            value={it.label}
            onChangeText={(t) => updateItem(idx, { label: t })}
            placeholder='Label'
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, styles.inputLabel, { color: theme.text }]}
            testID={`apple-pay-summary-item-label-${idx}`}
          />
          <TextInput
            value={it.amount}
            onChangeText={(t) => updateItem(idx, { amount: t })}
            placeholder='0.00'
            keyboardType='decimal-pad'
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, styles.inputAmount, { color: theme.text }]}
            testID={`apple-pay-summary-item-amount-${idx}`}
          />
          <Pressable
            onPress={() => removeItem(idx)}
            accessibilityLabel={`Remove summary item ${it.label}`}
            testID={`apple-pay-summary-item-remove-${idx}`}
            style={styles.removeBtn}
          >
            <ThemedText type='small' themeColor='tintB'>
              ✕
            </ThemedText>
          </Pressable>
        </View>
      ))}
      <View style={styles.row}>
        <TextInput
          value={draftLabel}
          onChangeText={setDraftLabel}
          placeholder='New label'
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, styles.inputLabel, { color: theme.text }]}
          testID='apple-pay-summary-item-draft-label'
        />
        <TextInput
          value={draftAmount}
          onChangeText={setDraftAmount}
          placeholder='0.00'
          keyboardType='decimal-pad'
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, styles.inputAmount, { color: theme.text }]}
          testID='apple-pay-summary-item-draft-amount'
        />
        <Pressable
          onPress={addItem}
          testID='apple-pay-summary-item-add'
          style={styles.removeBtn}
          accessibilityLabel='Add summary item'
        >
          <ThemedText type='small'>+</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8E8E93',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  inputLabel: {
    flex: 1,
  },
  inputAmount: {
    width: 96,
  },
  removeBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
