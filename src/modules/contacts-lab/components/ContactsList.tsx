/**
 * ContactsList — Paginated list of contacts.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Contact } from '../types';
import { ContactRow } from './ContactRow';

interface ContactsListProps {
  contacts: Contact[];
  hasNextPage: boolean;
  onLoadMore: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onSelectContact: (contact: Contact) => void;
  disabled: boolean;
}

export function ContactsList({
  contacts,
  hasNextPage,
  onLoadMore,
  onRefresh,
  onSelectContact,
  disabled,
}: ContactsListProps) {
  const [inFlight, setInFlight] = React.useState(false);

  const handleRefresh = async () => {
    if (disabled || inFlight) return;
    setInFlight(true);
    try {
      await onRefresh();
    } finally {
      setInFlight(false);
    }
  };

  const handleLoadMore = async () => {
    if (disabled || inFlight || !hasNextPage) return;
    setInFlight(true);
    try {
      await onLoadMore();
    } finally {
      setInFlight(false);
    }
  };

  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='contacts-list-card'>
      <ThemedText type='subtitle' style={styles.title}>
        List & Manage
      </ThemedText>

      <Pressable
        style={styles.button}
        onPress={handleRefresh}
        disabled={disabled || inFlight}
        testID='contacts-list-refresh-button'
      >
        <ThemedText type='small' themeColor='tintA'>
          {inFlight ? 'Refreshing...' : 'Refresh'}
        </ThemedText>
      </Pressable>

      <ScrollView style={styles.scrollView} testID='contacts-list-scroll'>
        {contacts.map((contact) => (
          <ContactRow key={contact.id} contact={contact} onPress={() => onSelectContact(contact)} />
        ))}
      </ScrollView>

      {contacts.length === 0 && !inFlight ? (
        <ThemedText type='small' themeColor='textSecondary'>
          No contacts found. Tap Refresh to load contacts.
        </ThemedText>
      ) : null}

      {hasNextPage ? (
        <Pressable
          style={styles.button}
          onPress={handleLoadMore}
          disabled={disabled || inFlight}
          testID='contacts-list-load-more-button'
        >
          <ThemedText type='small' themeColor='tintA'>
            {inFlight ? 'Loading...' : 'Load More'}
          </ThemedText>
        </Pressable>
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
  scrollView: {
    maxHeight: 400,
  },
});
