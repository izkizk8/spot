/**
 * SearchCard — Search contacts by name.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Contact } from '../types';
import { formatContactName, formatPhoneNumber, formatEmail } from '../formatters';

interface SearchCardProps {
  onSearch: (name: string) => Promise<void>;
  results: Contact[];
  disabled: boolean;
}

export function SearchCard({ onSearch, results, disabled }: SearchCardProps) {
  const [query, setQuery] = useState('');
  const [inFlight, setInFlight] = useState(false);
  const theme = useTheme();

  const handleSearch = async () => {
    if (disabled || inFlight || !query.trim()) return;
    setInFlight(true);
    try {
      await onSearch(query);
    } finally {
      setInFlight(false);
    }
  };

  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='contacts-search-card'>
      <ThemedText type='subtitle' style={styles.title}>
        Search Contacts
      </ThemedText>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        placeholder='Enter name...'
        placeholderTextColor={theme.textSecondary}
        value={query}
        onChangeText={setQuery}
        editable={!disabled}
        testID='contacts-search-input'
      />

      <Pressable
        style={styles.button}
        onPress={handleSearch}
        disabled={disabled || inFlight || !query.trim()}
        testID='contacts-search-button'
      >
        <ThemedText type='small' themeColor='tintA'>
          {inFlight ? 'Searching...' : 'Search'}
        </ThemedText>
      </Pressable>

      {results.length > 0 ? (
        <ThemedView style={styles.results} testID='contacts-search-results'>
          {results.map((contact) => (
            <ThemedView key={contact.id} style={styles.resultRow}>
              <ThemedText type='small'>{formatContactName(contact)}</ThemedText>
              <ThemedText type='small' themeColor='textSecondary'>
                {contact.phoneNumbers && contact.phoneNumbers.length > 0
                  ? formatPhoneNumber(contact.phoneNumbers[0]?.number)
                  : 'No phone'}
              </ThemedText>
              <ThemedText type='small' themeColor='textSecondary'>
                {contact.emails && contact.emails.length > 0
                  ? formatEmail(contact.emails[0]?.email)
                  : 'No email'}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      ) : null}

      {results.length === 0 && !inFlight && query ? (
        <ThemedText type='small' themeColor='textSecondary'>
          No contacts found
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    fontSize: 14,
  },
  button: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    alignSelf: 'flex-start',
  },
  results: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  resultRow: {
    padding: Spacing.two,
    gap: Spacing.one,
  },
});
