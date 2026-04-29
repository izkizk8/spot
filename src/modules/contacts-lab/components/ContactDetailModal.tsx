/**
 * ContactDetailModal — View/edit/delete contact modal.
 */

import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Contact, ContactInput } from '../types';
import { formatContactName } from '../formatters';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onUpdate: (input: ContactInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ContactDetailModal({
  contact,
  onClose,
  onUpdate,
  onDelete,
}: ContactDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [inFlight, setInFlight] = useState(false);
  const theme = useTheme();

  React.useEffect(() => {
    if (contact) {
      setGivenName(contact.givenName || '');
      setFamilyName(contact.familyName || '');
      setPhone(contact.phoneNumbers?.[0]?.number || '');
      setEmail(contact.emails?.[0]?.email || '');
      setCompany(contact.company || '');
      setEditing(false);
    }
  }, [contact]);

  const handleSave = async () => {
    if (!contact || inFlight) return;
    setInFlight(true);
    try {
      const input: ContactInput = {
        id: contact.id,
        givenName: givenName || undefined,
        familyName: familyName || undefined,
        phoneNumbers: phone ? [{ number: phone }] : undefined,
        emails: email ? [{ email }] : undefined,
        company: company || undefined,
      };
      await onUpdate(input);
      setEditing(false);
      onClose();
    } finally {
      setInFlight(false);
    }
  };

  const handleDelete = () => {
    if (!contact) return;
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${formatContactName(contact)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setInFlight(true);
            try {
              await onDelete(contact.id);
              onClose();
            } finally {
              setInFlight(false);
            }
          },
        },
      ],
    );
  };

  if (!contact) return null;

  return (
    <Modal
      visible={!!contact}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="contacts-detail-modal"
    >
      <ThemedView style={styles.overlay}>
        <ThemedView style={styles.modal} type="backgroundElement">
          <ThemedText type="subtitle" style={styles.title}>
            {editing ? 'Edit Contact' : 'Contact Details'}
          </ThemedText>

          {editing ? (
            <>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Given name"
                placeholderTextColor={theme.textSecondary}
                value={givenName}
                onChangeText={setGivenName}
                testID="contacts-detail-edit-given-name"
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Family name"
                placeholderTextColor={theme.textSecondary}
                value={familyName}
                onChangeText={setFamilyName}
                testID="contacts-detail-edit-family-name"
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Phone"
                placeholderTextColor={theme.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                testID="contacts-detail-edit-phone"
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="contacts-detail-edit-email"
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Organization"
                placeholderTextColor={theme.textSecondary}
                value={company}
                onChangeText={setCompany}
                testID="contacts-detail-edit-company"
              />
            </>
          ) : (
            <>
              <ThemedText type="small">Name: {formatContactName(contact)}</ThemedText>
              <ThemedText type="small">Phone: {phone || 'N/A'}</ThemedText>
              <ThemedText type="small">Email: {email || 'N/A'}</ThemedText>
              <ThemedText type="small">Organization: {company || 'N/A'}</ThemedText>
            </>
          )}

          <ThemedView style={styles.buttons}>
            {editing ? (
              <>
                <Pressable
                  style={styles.button}
                  onPress={handleSave}
                  disabled={inFlight}
                  testID="contacts-detail-save-button"
                >
                  <ThemedText type="small" themeColor="tintA">
                    {inFlight ? 'Saving...' : 'Save'}
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={styles.button}
                  onPress={() => setEditing(false)}
                  disabled={inFlight}
                  testID="contacts-detail-cancel-button"
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    Cancel
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={styles.button}
                  onPress={() => setEditing(true)}
                  disabled={inFlight}
                  testID="contacts-detail-edit-button"
                >
                  <ThemedText type="small" themeColor="tintA">
                    Edit
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={styles.button}
                  onPress={handleDelete}
                  disabled={inFlight}
                  testID="contacts-detail-delete-button"
                >
                  <ThemedText type="small" themeColor="tintB">
                    Delete
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={styles.button}
                  onPress={onClose}
                  testID="contacts-detail-close-button"
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    Close
                  </ThemedText>
                </Pressable>
              </>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '80%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  button: {
    padding: Spacing.two,
  },
});
