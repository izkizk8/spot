/**
 * ScopesPicker — Checkbox group for Sign in with Apple scopes.
 *
 * Two checkboxes: email and fullName.
 * Defaults to both selected.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ScopesPickerProps {
  value: { email: boolean; fullName: boolean };
  onChange: (scopes: { email: boolean; fullName: boolean }) => void;
  disabled?: boolean;
}

export default function ScopesPicker({ value, onChange, disabled }: ScopesPickerProps) {
  return (
    <ThemedView style={styles.container} type='backgroundElement'>
      <ThemedText type='subtitle' style={styles.title}>
        Requested Scopes
      </ThemedText>

      <Pressable
        style={styles.row}
        onPress={() => !disabled && onChange({ ...value, email: !value.email })}
        disabled={disabled}
        accessibilityRole='checkbox'
        accessibilityState={{ checked: value.email, disabled }}
        testID='siwa-scope-email'
      >
        <ThemedText type='default'>{value.email ? '☑' : '☐'} Email</ThemedText>
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => !disabled && onChange({ ...value, fullName: !value.fullName })}
        disabled={disabled}
        accessibilityRole='checkbox'
        accessibilityState={{ checked: value.fullName, disabled }}
        testID='siwa-scope-fullName'
      >
        <ThemedText type='default'>{value.fullName ? '☑' : '☐'} Full Name</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  row: {
    paddingVertical: Spacing.one,
  },
});
