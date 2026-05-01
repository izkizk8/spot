/**
 * RestoreButton — StoreKit Lab (feature 050).
 *
 * Triggers `AppStore.sync()` via the hook. Controlled by the
 * parent (loading + disabled).
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface RestoreButtonProps {
  readonly style?: ViewStyle;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onPress: () => void;
}

export default function RestoreButton({ style, disabled, loading, onPress }: RestoreButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole='button'
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      testID='storekit-restore-button'
      style={[styles.btn, isDisabled && styles.btnDisabled, style]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color='#ffffff' testID='storekit-restore-button-spinner' />
        ) : (
          <ThemedText type='small' style={styles.label}>
            Restore purchases
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#5856d6',
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
