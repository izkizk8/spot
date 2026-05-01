/**
 * Contacts Lab Screen (Web stub)
 * Feature: 038-contacts
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { AuthorizationCard } from './components/AuthorizationCard';
import { PickerCard } from './components/PickerCard';
import { SearchCard } from './components/SearchCard';
import { ComposeCard } from './components/ComposeCard';
import { ContactsList } from './components/ContactsList';

export default function ContactsLabScreen() {
  const stubAuth = {
    status: 'denied' as const,
    onRequestAccess: () => {},
    inFlight: false,
  };

  const stubPicker = {
    onPick: async () => null,
    disabled: true,
  };

  const stubSearch = {
    onSearch: async () => {},
    results: [],
    disabled: true,
  };

  const stubCompose = {
    onSave: async () => {},
    disabled: true,
  };

  const stubList = {
    contacts: [],
    hasNextPage: false,
    onLoadMore: async () => {},
    onRefresh: async () => {},
    onSelectContact: () => {},
    disabled: true,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <IOSOnlyBanner />

        <AuthorizationCard {...stubAuth} />
        <PickerCard {...stubPicker} />
        <SearchCard {...stubSearch} />
        <ComposeCard {...stubCompose} />
        <ContactsList {...stubList} />
      </ScrollView>
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
