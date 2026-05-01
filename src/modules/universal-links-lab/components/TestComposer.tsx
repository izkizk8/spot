/**
 * TestComposer — Universal Links Lab (feature 041).
 *
 * Lets the user type a https URL and dispatch it via
 * `useUniversalLinks().dispatch` (which delegates to
 * `Linking.openURL`). On iOS, if the URL host matches a configured
 * `applinks:` domain, the OS will route the URL back into this app —
 * which surfaces in the InvocationsLog as a self-test.
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TestComposerProps {
  readonly onDispatch: (url: string) => void;
  readonly lastEchoedUrl?: string;
  readonly style?: ViewStyle;
}

export function validateUrl(raw: string): string | undefined {
  if (raw.length === 0) return 'URL is required';
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(raw)) {
    return 'URL must be a valid absolute http/https URL';
  }
  return undefined;
}

export default function TestComposer({ onDispatch, lastEchoedUrl, style }: TestComposerProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState('https://spot.example.com/lab/universal-links');
  const error = validateUrl(draft);
  const canSubmit = error === undefined;

  const inputStyle: TextStyle = {
    color: theme.text,
    borderColor: theme.backgroundSelected,
    backgroundColor: theme.backgroundElement,
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onDispatch(draft);
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Test Composer</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Enter a https URL and dispatch it via Linking.openURL. If the host matches a configured
        applinks: domain and the AASA file is in place, iOS will route the URL back into the app and
        a row will appear in the Invocations log below.
      </ThemedText>
      <TextInput
        testID='test-url-input'
        style={[styles.input, inputStyle]}
        value={draft}
        onChangeText={setDraft}
        autoCapitalize='none'
        autoCorrect={false}
        placeholder='https://your-domain.example/path'
        placeholderTextColor={theme.textSecondary}
      />
      {error !== undefined ? (
        <ThemedText type='small' themeColor='tintB' style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
      <Pressable
        testID='dispatch-btn'
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityState={{ disabled: !canSubmit }}
        style={[
          styles.submitBtn,
          { backgroundColor: canSubmit ? theme.tintA : theme.backgroundElement },
        ]}
      >
        <ThemedText type='smallBold' themeColor={canSubmit ? 'background' : 'textSecondary'}>
          Dispatch via Linking.openURL
        </ThemedText>
      </Pressable>
      {lastEchoedUrl !== undefined && lastEchoedUrl.length > 0 ? (
        <View style={styles.echoBox} testID='echo-box'>
          <ThemedText type='smallBold'>Echoed final route:</ThemedText>
          <ThemedText type='small' themeColor='textSecondary'>
            {lastEchoedUrl}
          </ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
  },
  submitBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  error: {
    fontStyle: 'italic',
  },
  echoBox: {
    paddingVertical: Spacing.one,
    gap: Spacing.half,
  },
});
