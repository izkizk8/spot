/**
 * ContactRow — Single contact row in list.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Contact } from '../types';
import { formatContactName, formatPhoneNumber, formatEmail } from '../formatters';

interface ContactRowProps {
  contact: Contact;
  onPress: () => void;
}

export function ContactRow({ contact, onPress }: ContactRowProps) {
  return (
    <Pressable onPress={onPress} testID={`contact-row-${contact.id}`}>
      <ThemedView style={styles.container} type="backgroundElement">
        <ThemedText type="small">{formatContactName(contact)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {contact.phoneNumbers && contact.phoneNumbers.length > 0
            ? formatPhoneNumber(contact.phoneNumbers[0]?.number)
            : 'No phone'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {contact.emails && contact.emails.length > 0
            ? formatEmail(contact.emails[0]?.email)
            : 'No email'}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
  },
});
