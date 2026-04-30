/**
 * PaymentComposer Component
 * Feature: 051-tap-to-pay
 *
 * Payment request composer: amount, currency, line items.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

import type { AcceptPaymentOptions, LineItem } from '@/native/taptopay.types';
import { CURRENCIES } from '../currency-codes';

interface PaymentComposerProps {
  onPaymentReady: (opts: AcceptPaymentOptions) => void;
  style?: ViewStyle;
}

export default function PaymentComposer({ onPaymentReady, style }: PaymentComposerProps) {
  const colors = useTheme();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const handleAddLineItem = () => {
    if (newLabel.length > 0 && newAmount.length > 0) {
      const amountCents = parseInt(newAmount, 10);
      if (!isNaN(amountCents) && amountCents >= 0) {
        setLineItems([...lineItems, { label: newLabel, amount: amountCents }]);
        setNewLabel('');
        setNewAmount('');
      }
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCompose = () => {
    const amountCents = parseInt(amount, 10);
    if (!isNaN(amountCents) && amountCents > 0) {
      onPaymentReady({
        amount: amountCents,
        currency,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
      });
    }
  };

  const isValid = amount.length > 0 && parseInt(amount, 10) > 0;

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Payment Composer</ThemedText>

      <ThemedText style={styles.label}>Amount (cents)</ThemedText>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.textSecondary }]}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="1234"
        placeholderTextColor={colors.textSecondary}
      />

      <ThemedText style={styles.label}>Currency</ThemedText>
      <ThemedView style={styles.pickerContainer}>
        {CURRENCIES.slice(0, 5).map((cur) => (
          <Pressable
            key={cur.code}
            onPress={() => setCurrency(cur.code)}
            style={[styles.currencyButton, currency === cur.code && styles.currencyButtonSelected]}
          >
            <ThemedText
              style={[styles.currencyText, currency === cur.code && styles.currencyTextSelected]}
            >
              {cur.code}
            </ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <ThemedText style={styles.label}>Line Items (optional)</ThemedText>
      {lineItems.map((item, index) => (
        <ThemedView key={index} style={styles.lineItemRow}>
          <ThemedText style={styles.lineItemText}>
            {item.label}: {item.amount}
          </ThemedText>
          <Pressable onPress={() => handleRemoveLineItem(index)}>
            <ThemedText style={styles.removeButton}>✗</ThemedText>
          </Pressable>
        </ThemedView>
      ))}
      <ThemedView style={styles.addLineItemRow}>
        <TextInput
          style={[styles.lineItemInput, { color: colors.text, borderColor: colors.textSecondary }]}
          value={newLabel}
          onChangeText={setNewLabel}
          placeholder="Label"
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          style={[styles.lineItemInput, { color: colors.text, borderColor: colors.textSecondary }]}
          value={newAmount}
          onChangeText={setNewAmount}
          keyboardType="numeric"
          placeholder="Amount"
          placeholderTextColor={colors.textSecondary}
        />
        <Pressable onPress={handleAddLineItem} style={styles.addButton}>
          <ThemedText style={styles.addButtonText}>+</ThemedText>
        </Pressable>
      </ThemedView>

      <Pressable
        onPress={handleCompose}
        disabled={!isValid}
        style={[styles.composeButton, !isValid && styles.composeButtonDisabled]}
      >
        <ThemedText style={styles.composeButtonText}>Compose Payment</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  currencyButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  currencyButtonSelected: {
    backgroundColor: '#007AFF',
  },
  currencyText: {
    fontSize: 14,
  },
  currencyTextSelected: {
    color: '#FFFFFF',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: 8,
  },
  lineItemText: {
    fontSize: 14,
  },
  removeButton: {
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addLineItemRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  lineItemInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two,
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  composeButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  composeButtonDisabled: {
    opacity: 0.5,
  },
  composeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
