/**
 * PayButton — Apple Pay Lab (feature 049).
 *
 * Stand-in for `PKPaymentButton`. On iOS the styling mimics
 * Apple's "Pay with " glyph guidance; on Android / Web
 * the button is disabled with an explanatory label. Controlled
 * by the parent (loading + disabled).
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface PayButtonProps {
  readonly style?: ViewStyle;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onPress: () => void;
}

export default function PayButton({ style, disabled, loading, onPress }: PayButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole='button'
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      testID='apple-pay-pay-button'
      style={[styles.btn, isDisabled && styles.btnDisabled, style]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color='#ffffff' testID='apple-pay-pay-button-spinner' />
        ) : (
          <ThemedText type='small' style={styles.label}>
            Pay with Pay
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#000000',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
