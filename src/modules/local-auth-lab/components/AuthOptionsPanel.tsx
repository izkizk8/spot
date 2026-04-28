/**
 * AuthOptionsPanel — Configures authenticateAsync options.
 *
 * Switch for `disableDeviceFallback`; text inputs for `promptMessage`,
 * `fallbackLabel`, `cancelLabel`.
 */

import React from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface AuthOptionsValue {
  promptMessage: string;
  fallbackLabel: string;
  cancelLabel: string;
  disableDeviceFallback: boolean;
}

interface AuthOptionsPanelProps {
  value: AuthOptionsValue;
  onChange: (next: AuthOptionsValue) => void;
  onAuthenticate: () => void;
  disabled?: boolean;
}

export default function AuthOptionsPanel({
  value,
  onChange,
  onAuthenticate,
  disabled,
}: AuthOptionsPanelProps) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="localauth-options">
      <ThemedText type="subtitle" style={styles.title}>
        Options
      </ThemedText>

      <View style={styles.row}>
        <ThemedText type="small">Disable device fallback</ThemedText>
        <Switch
          value={value.disableDeviceFallback}
          onValueChange={(v) => onChange({ ...value, disableDeviceFallback: v })}
          disabled={disabled}
          testID="localauth-options-disablefallback"
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Prompt message
        </ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
          value={value.promptMessage}
          onChangeText={(t) => onChange({ ...value, promptMessage: t })}
          editable={!disabled}
          placeholder="Authenticate to continue"
          placeholderTextColor={theme.textSecondary}
          testID="localauth-options-prompt"
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Fallback label (iOS)
        </ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
          value={value.fallbackLabel}
          onChangeText={(t) => onChange({ ...value, fallbackLabel: t })}
          editable={!disabled}
          placeholder="Use Passcode"
          placeholderTextColor={theme.textSecondary}
          testID="localauth-options-fallback"
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Cancel label
        </ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
          value={value.cancelLabel}
          onChangeText={(t) => onChange({ ...value, cancelLabel: t })}
          editable={!disabled}
          placeholder="Cancel"
          placeholderTextColor={theme.textSecondary}
          testID="localauth-options-cancel"
        />
      </View>

      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onAuthenticate}
        disabled={disabled}
        testID="localauth-authenticate"
      >
        <ThemedText type="default" themeColor={disabled ? 'textSecondary' : 'tintA'}>
          Authenticate
        </ThemedText>
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
  title: {
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
  },
  button: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
