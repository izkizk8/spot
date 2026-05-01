/**
 * ComposeCard — Create new contact form.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ContactInput } from '../types';

interface ComposeCardProps {
  onSave: (input: ContactInput) => Promise<void>;
  disabled: boolean;
}

export function ComposeCard({ onSave, disabled }: ComposeCardProps) {
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [inFlight, setInFlight] = useState(false);
  const theme = useTheme();

  const handleSave = async () => {
    if (disabled || inFlight) return;
    const hasData = givenName || familyName || phone || email || company;
    if (!hasData) return;

    setInFlight(true);
    try {
      const input: ContactInput = {
        givenName: givenName || undefined,
        familyName: familyName || undefined,
        phoneNumbers: phone ? [{ number: phone }] : undefined,
        emails: email ? [{ email }] : undefined,
        company: company || undefined,
      };
      await onSave(input);
      setGivenName('');
      setFamilyName('');
      setPhone('');
      setEmail('');
      setCompany('');
    } finally {
      setInFlight(false);
    }
  };

  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='contacts-compose-card'>
      <ThemedText type='subtitle' style={styles.title}>
        Create Contact
      </ThemedText>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        placeholder='Given name'
        placeholderTextColor={theme.textSecondary}
        value={givenName}
        onChangeText={setGivenName}
        editable={!disabled}
        testID='contacts-compose-given-name'
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        placeholder='Family name'
        placeholderTextColor={theme.textSecondary}
        value={familyName}
        onChangeText={setFamilyName}
        editable={!disabled}
        testID='contacts-compose-family-name'
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        placeholder='Phone'
        placeholderTextColor={theme.textSecondary}
        value={phone}
        onChangeText={setPhone}
        editable={!disabled}
        keyboardType='phone-pad'
        testID='contacts-compose-phone'
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        placeholder='Email'
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        editable={!disabled}
        keyboardType='email-address'
        autoCapitalize='none'
        testID='contacts-compose-email'
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        placeholder='Organization'
        placeholderTextColor={theme.textSecondary}
        value={company}
        onChangeText={setCompany}
        editable={!disabled}
        testID='contacts-compose-company'
      />

      <Pressable
        style={styles.button}
        onPress={handleSave}
        disabled={disabled || inFlight}
        testID='contacts-compose-save-button'
      >
        <ThemedText type='small' themeColor='tintA'>
          {inFlight ? 'Saving...' : 'Save'}
        </ThemedText>
      </Pressable>
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
});
