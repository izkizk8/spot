/**
 * SearchTestCard — feature 031 / T032.
 *
 * Input + CTA + results list for Spotlight search testing.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SearchableItem } from '@/native/spotlight.types';

interface SearchTestCardProps {
  readonly pending: boolean;
  readonly results: readonly SearchableItem[];
  readonly error: string | null;
  readonly onSearch: (query: string) => void;
  readonly hasSearched: boolean;
  readonly style?: ViewStyle;
}

export default function SearchTestCard({
  pending,
  results,
  error,
  onSearch,
  hasSearched,
  style,
}: SearchTestCardProps) {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const isDisabled = pending || trimmed.length === 0;

  const handleSubmit = () => {
    if (!isDisabled) {
      onSearch(trimmed);
    }
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Search Test</ThemedText>
      <ThemedView style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder='Search indexed items...'
          placeholderTextColor='rgba(142, 142, 147, 0.8)'
          value={query}
          onChangeText={setQuery}
          returnKeyType='search'
          onSubmitEditing={handleSubmit}
        />
        <Pressable
          accessibilityRole='button'
          accessibilityState={{ disabled: isDisabled }}
          onPress={handleSubmit}
          disabled={isDisabled}
          style={[styles.button, isDisabled && styles.buttonDisabled]}
        >
          <ThemedText style={styles.buttonText}>Search Spotlight</ThemedText>
        </Pressable>
      </ThemedView>
      {error != null && (
        <ThemedView style={styles.errorRow}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}
      {hasSearched && results.length === 0 && error == null && (
        <ThemedText style={styles.emptyText}>No results found</ThemedText>
      )}
      {results.length > 0 && (
        <ThemedView style={styles.results}>
          {results.map((item) => (
            <ThemedView key={item.id} style={styles.resultRow}>
              <ThemedText style={styles.resultTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.resultDesc}>{item.contentDescription}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.3)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    color: '#000',
  },
  button: {
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    borderRadius: Spacing.two,
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorRow: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: Spacing.one,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
  },
  emptyText: {
    marginTop: Spacing.three,
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 14,
  },
  results: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  resultRow: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.half,
  },
  resultDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
});
