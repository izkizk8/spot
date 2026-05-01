/**
 * GreetForm — labelled name input + Greet button.
 *
 * The Greet button is disabled when the trimmed name is empty.
 * On press it emits the trimmed name to the parent.
 */

import React from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface GreetFormProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onGreet: (trimmedName: string) => void;
  readonly greetLabel?: string;
}

export function GreetForm({ value, onChange, onGreet, greetLabel }: GreetFormProps) {
  const trimmed = value.trim();
  const disabled = trimmed.length === 0;
  const label = greetLabel ?? 'Greet user';

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>Name</ThemedText>
      <TextInput
        accessibilityLabel='Name'
        value={value}
        onChangeText={onChange}
        autoCapitalize='words'
        autoCorrect={false}
        placeholder='Type a name'
        placeholderTextColor='#9A9CA1'
        style={styles.input}
      />
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onGreet(trimmed)}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <ThemedText style={styles.buttonText}>{label}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
    borderRadius: Spacing.one,
    fontSize: 16,
    color: '#000000',
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0B4BA',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
