/**
 * PickerCard — Present native contact picker.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Contact } from '../types';
import { formatContactName, formatPhoneNumber, formatEmail } from '../formatters';

interface PickerCardProps {
  onPick: () => Promise<Contact | null>;
  disabled: boolean;
}

export function PickerCard({ onPick, disabled }: PickerCardProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [inFlight, setInFlight] = useState(false);

  const handlePick = async () => {
    if (disabled || inFlight) return;
    setInFlight(true);
    try {
      const contact = await onPick();
      setSelectedContact(contact);
    } finally {
      setInFlight(false);
    }
  };

  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="contacts-picker-card">
      <ThemedText type="subtitle" style={styles.title}>
        Contact Picker
      </ThemedText>

      <Pressable
        style={styles.button}
        onPress={handlePick}
        disabled={disabled || inFlight}
        testID="contacts-picker-button"
      >
        <ThemedText type="small" themeColor="tintA">
          {inFlight ? 'Opening...' : 'Open contact picker'}
        </ThemedText>
      </Pressable>

      {selectedContact ? (
        <ThemedView style={styles.result} testID="contacts-picker-result">
          <ThemedText type="small">{formatContactName(selectedContact)}</ThemedText>
          {selectedContact.phoneNumbers && selectedContact.phoneNumbers.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Phone: {formatPhoneNumber(selectedContact.phoneNumbers[0]?.number)}
            </ThemedText>
          ) : null}
          {selectedContact.emails && selectedContact.emails.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Email: {formatEmail(selectedContact.emails[0]?.email)}
            </ThemedText>
          ) : null}
        </ThemedView>
      ) : null}

      {!selectedContact && !inFlight ? (
        <ThemedText type="small" themeColor="textSecondary">
          No contact selected
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
  button: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    alignSelf: 'flex-start',
  },
  result: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
});
