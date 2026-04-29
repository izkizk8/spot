/**
 * AddFromUrlCard — URL input + fetch affordance.
 * Feature: 036-passkit-wallet
 */

import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ClassifiedError } from '@/modules/passkit-lab/hooks/usePassKit';

interface Props {
  readonly onAddFromURL: (url: string) => void;
  readonly lastError: ClassifiedError | null;
  readonly lastResult: { added: boolean } | null;
}

export function AddFromUrlCard({ onAddFromURL, lastError, lastResult }: Props) {
  const [url, setUrl] = useState('');
  const theme = useTheme();

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (trimmed) {
      onAddFromURL(trimmed);
    }
  };

  const getStatusText = () => {
    if (lastError) {
      return lastError.message;
    }
    if (lastResult?.added) {
      return 'Pass added';
    }
    return null;
  };

  const statusText = getStatusText();
  const isEmpty = url.trim() === '';

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Add from URL</ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            borderColor: theme.textSecondary,
          },
        ]}
        placeholder="Enter URL (https://example.com/pass.pkpass)"
        placeholderTextColor={theme.textSecondary}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="url-input"
      />
      <TouchableOpacity
        onPress={handleSubmit}
        accessibilityRole="button"
        style={[styles.button, isEmpty && styles.buttonDisabled]}
        disabled={isEmpty}
      >
        <ThemedText style={styles.buttonText}>Fetch and add</ThemedText>
      </TouchableOpacity>
      {statusText && <ThemedText style={styles.status}>{statusText}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  status: { fontSize: 12, opacity: 0.7, marginTop: Spacing.two },
});
