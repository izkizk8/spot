/**
 * Contacts Lab Screen (Android)
 * Feature: 038-contacts
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { useContacts } from './hooks/useContacts';
import { AuthorizationCard } from './components/AuthorizationCard';
import { PickerCard } from './components/PickerCard';
import { SearchCard } from './components/SearchCard';
import { ComposeCard } from './components/ComposeCard';
import { ContactsList } from './components/ContactsList';
import { ContactDetailModal } from './components/ContactDetailModal';
import type { Contact } from './types';

export default function ContactsLabScreen() {
  const contacts = useContacts();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);

  const handleSearch = async (name: string) => {
    await contacts.search(name);
    setSearchResults(contacts.contacts);
  };

  const handleSaveContact = async (input: Parameters<typeof contacts.addContact>[0]) => {
    await contacts.addContact(input);
    await contacts.refresh();
  };

  const handleUpdateContact = async (input: Parameters<typeof contacts.updateContact>[0]) => {
    await contacts.updateContact(input);
    await contacts.refresh();
  };

  const handleDeleteContact = async (id: string) => {
    await contacts.removeContact(id);
    await contacts.refresh();
  };

  const disabled = contacts.status !== 'authorized' && contacts.status !== 'limited';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AuthorizationCard
          status={contacts.status}
          onRequestAccess={contacts.requestPermissions}
          inFlight={contacts.inFlight}
        />

        <PickerCard onPick={contacts.presentContactPicker} disabled={disabled} />

        <SearchCard onSearch={handleSearch} results={searchResults} disabled={disabled} />

        <ComposeCard onSave={handleSaveContact} disabled={disabled} />

        <ContactsList
          contacts={contacts.contacts}
          hasNextPage={contacts.hasNextPage}
          onLoadMore={contacts.loadMore}
          onRefresh={contacts.refresh}
          onSelectContact={setSelectedContact}
          disabled={disabled}
        />
      </ScrollView>

      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onUpdate={handleUpdateContact}
        onDelete={handleDeleteContact}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
