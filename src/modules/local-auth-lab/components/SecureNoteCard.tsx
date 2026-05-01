/**
 * SecureNoteCard — Biometric-gated secret note demo.
 *
 * Save: writes the input to Keychain.
 * View: triggers a fresh biometric authenticate before revealing the note.
 * Clear: deletes the Keychain entry and collapses the reveal.
 */

import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface SecureNoteCardProps {
  draft: string;
  onDraftChange: (next: string) => void;
  storedNote: string | null;
  revealed: boolean;
  onSave: () => void;
  onView: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function SecureNoteCard({
  draft,
  onDraftChange,
  storedNote,
  revealed,
  onSave,
  onView,
  onClear,
  disabled,
}: SecureNoteCardProps) {
  const theme = useTheme();
  const hasNote = storedNote !== null;

  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='localauth-securenote'>
      <ThemedText type='subtitle' style={styles.title}>
        Secure Note
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Saved to Keychain; viewing requires a successful biometric authenticate.
      </ThemedText>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
        value={draft}
        onChangeText={onDraftChange}
        editable={!disabled}
        placeholder='Type your note…'
        placeholderTextColor={theme.textSecondary}
        multiline
        testID='localauth-securenote-input'
      />

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, (disabled || draft.length === 0) && styles.buttonDisabled]}
          onPress={onSave}
          disabled={disabled || draft.length === 0}
          testID='localauth-securenote-save'
        >
          <ThemedText
            type='default'
            themeColor={disabled || draft.length === 0 ? 'textSecondary' : 'tintA'}
          >
            Save securely
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.button, (disabled || !hasNote) && styles.buttonDisabled]}
          onPress={onView}
          disabled={disabled || !hasNote}
          testID='localauth-securenote-view'
        >
          <ThemedText type='default' themeColor={disabled || !hasNote ? 'textSecondary' : 'tintA'}>
            View
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.button, (disabled || !hasNote) && styles.buttonDisabled]}
          onPress={onClear}
          disabled={disabled || !hasNote}
          testID='localauth-securenote-clear'
        >
          <ThemedText type='default' themeColor={disabled || !hasNote ? 'textSecondary' : 'tintB'}>
            Clear
          </ThemedText>
        </Pressable>
      </View>

      {!hasNote && (
        <ThemedText type='small' themeColor='textSecondary' testID='localauth-securenote-empty'>
          No note stored
        </ThemedText>
      )}

      {hasNote && !revealed && (
        <ThemedText type='small' themeColor='textSecondary' testID='localauth-securenote-hidden'>
          Note is stored but hidden — tap View to authenticate.
        </ThemedText>
      )}

      {hasNote && revealed && storedNote && (
        <ThemedText type='default' testID='localauth-securenote-revealed'>
          {storedNote}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    minHeight: 60,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  button: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    flexGrow: 1,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
