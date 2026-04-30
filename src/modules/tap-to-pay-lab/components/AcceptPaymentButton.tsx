/**
 * AcceptPaymentButton Component
 * Feature: 051-tap-to-pay
 *
 * Button to trigger payment acceptance.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface AcceptPaymentButtonProps {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  style?: ViewStyle;
}

export default function AcceptPaymentButton({
  onPress,
  loading,
  disabled,
  style,
}: AcceptPaymentButtonProps) {
  const buttonLabel = loading ? 'Processing...' : 'Accept Payment';
  const isDisabled = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
    >
      <ThemedText style={styles.buttonText}>{buttonLabel}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#FF9500',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
