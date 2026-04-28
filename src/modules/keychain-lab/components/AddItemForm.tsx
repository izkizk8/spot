/**
 * AddItemForm — collects a label, secret value, accessibility class and
 * biometry flag, and forwards a typed `AddItemInput` to the parent via
 * `onSave`. The parent (typically `useKeychainItems.addItem`) returns a
 * `KeychainResult` so duplicate-item upserts (US2-AS4) and other typed
 * outcomes are observable.
 *
 * Save is disabled until both label and value are non-empty (after trim)
 * and re-disabled while a save is in-flight. On a successful `'ok'`
 * result the form resets (inputs cleared, picker reset to default,
 * biometry off). Non-ok results leave the form intact so the user can
 * retry.
 *
 * Covers FR-016, US2-AS1–AS5.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { DEFAULT_ACCESSIBILITY_CLASS, type AccessibilityClass } from '../accessibility-classes';
import type { AddItemInput, KeychainResult } from '../types';
import AccessibilityPicker from './AccessibilityPicker';

interface AddItemFormProps {
  onSave: (input: AddItemInput) => Promise<KeychainResult>;
}

export default function AddItemForm({ onSave }: AddItemFormProps) {
  const theme = useTheme();

  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [accessibilityClass, setAccessibilityClass] = useState<AccessibilityClass>(
    DEFAULT_ACCESSIBILITY_CLASS,
  );
  const [biometryRequired, setBiometryRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmedLabel = label.trim();
  const canSave = trimmedLabel.length > 0 && value.length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;

    setSaving(true);
    const result = await onSave({
      label: trimmedLabel,
      value,
      accessibilityClass,
      biometryRequired,
    });
    setSaving(false);

    if (result.kind === 'ok') {
      setLabel('');
      setValue('');
      setAccessibilityClass(DEFAULT_ACCESSIBILITY_CLASS);
      setBiometryRequired(false);
    }
  }

  return (
    <ThemedView style={styles.container} type="backgroundElement">
      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Label
      </ThemedText>
      <TextInput
        testID="add-item-label"
        value={label}
        onChangeText={setLabel}
        placeholder="Label (e.g. demo)"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
      />

      <ThemedText type="smallBold" style={styles.fieldLabel}>
        Value
      </ThemedText>
      <TextInput
        testID="add-item-value"
        value={value}
        onChangeText={setValue}
        placeholder="Value (secret)"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
      />

      <AccessibilityPicker value={accessibilityClass} onChange={setAccessibilityClass} />

      <ThemedView style={styles.switchRow} type="backgroundElement">
        <ThemedText type="default" style={styles.switchLabel}>
          Require biometry on read
        </ThemedText>
        <Switch
          testID="add-item-biometry"
          value={biometryRequired}
          onValueChange={setBiometryRequired}
          disabled={saving}
        />
      </ThemedView>

      <Pressable
        testID="add-item-save"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
        disabled={!canSave}
        onPress={handleSave}
        style={[styles.saveButton, { backgroundColor: theme.tintA, opacity: canSave ? 1 : 0.5 }]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText type="default" style={styles.saveButtonText}>
            Save
          </ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  fieldLabel: {
    marginTop: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  switchLabel: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
