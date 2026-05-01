/**
 * UrlContentInput — feature 033 / T025.
 *
 * URL input with inline validation using isValidShareUrl (R-B).
 */

import React from 'react';
import { StyleSheet, TextInput, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface UrlContentInputProps {
  readonly value: string;
  readonly onChange: (url: string) => void;
  readonly style?: ViewStyle;
}

/**
 * Validate URL per research §2 (R-B):
 * - Non-empty after trim
 * - Prefixed with http:// or https://
 * - Has a non-empty host segment after the scheme
 *
 * Uses a regex rather than `new URL(...)` because the WHATWG URL constructor
 * behaves inconsistently across Jest test environments.
 */
const URL_PATTERN = /^https?:\/\/[^\s/?#]+(?:[/?#].*)?$/i;

function isValidShareUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return URL_PATTERN.test(trimmed);
}

export default function UrlContentInput({ value, onChange, style }: UrlContentInputProps) {
  const isValid = isValidShareUrl(value);

  return (
    <ThemedView style={style}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder='https://example.com'
        placeholderTextColor='#999'
        keyboardType='url'
        autoCapitalize='none'
        autoCorrect={false}
        style={[
          styles.input,
          {
            borderColor: isValid ? '#ddd' : '#ff3b30',
          },
        ]}
      />
      {!isValid && (
        <ThemedText style={styles.errorText}>
          Invalid URL. Must start with http:// or https://
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#000',
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: Spacing.one,
    marginLeft: Spacing.three,
  },
});
