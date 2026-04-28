/**
 * Speech Recognition Lab — iOS screen (US1, T041).
 *
 * Composes AuthStatusPill, AudioSessionIndicator, RecognitionModePicker,
 * LocalePicker, TranscriptView, MicButton, ActionRow into the FR-005
 * vertical layout. Wires `useSpeechSession` and expo-clipboard.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import bridge from '@/native/speech-recognition';
import type {
  AuthStatus,
  Locale,
  RecognitionMode,
} from '@/modules/speech-recognition-lab/speech-types';
import { TOP_LOCALES } from '@/modules/speech-recognition-lab/speech-types';

import AuthStatusPill from './components/AuthStatusPill';
import AudioSessionIndicator from './components/AudioSessionIndicator';
import RecognitionModePicker from './components/RecognitionModePicker';
import LocalePicker from './components/LocalePicker';
import TranscriptView from './components/TranscriptView';
import MicButton from './components/MicButton';
import ActionRow from './components/ActionRow';
import { useSpeechSession } from './hooks/useSpeechSession';

function resolveSystemLocale(): Locale {
  try {
    const sys = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().locale as
      | string
      | undefined;
    if (sys && (TOP_LOCALES as readonly string[]).includes(sys)) return sys;
  } catch {
    // ignore
  }
  return 'en-US';
}

export default function SpeechRecognitionLabScreen() {
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>('notDetermined');
  const [mode, setMode] = React.useState<RecognitionMode>('server');
  const [locale, setLocale] = React.useState<Locale>(resolveSystemLocale());

  const session = useSpeechSession();

  // Initial authorization probe.
  React.useEffect(() => {
    let cancelled = false;
    bridge.getAuthorizationStatus().then(
      (status) => {
        if (!cancelled) setAuthStatus(status);
      },
      () => {
        // bridge unavailable; leave status as notDetermined
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRequestAuth = React.useCallback(async () => {
    try {
      const next = await bridge.requestAuthorization();
      setAuthStatus(next);
    } catch {
      // SpeechRecognitionNotSupported on non-iOS — leave status as is.
    }
  }, []);

  const handleMicPress = React.useCallback(async () => {
    if (session.isListening) {
      await session.stop();
      return;
    }
    if (authStatus !== 'authorized') return;
    if (!bridge.isAvailable(locale)) return;
    try {
      await session.start({ locale, onDevice: mode === 'on-device' });
    } catch {
      // Hook surfaces error via `error` event channel; nothing else to do here.
    }
  }, [authStatus, locale, mode, session]);

  const handleCopy = React.useCallback(async () => {
    await Clipboard.setStringAsync(session.final);
  }, [session.final]);

  const handleClear = React.useCallback(() => {
    session.reset();
  }, [session]);

  const micDisabled = authStatus !== 'authorized';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <AuthStatusPill status={authStatus} onRequestPress={handleRequestAuth} />
          <AudioSessionIndicator active={session.isListening} />
        </View>

        <RecognitionModePicker
          mode={mode}
          onDeviceAvailable={false}
          onModeChange={setMode}
        />

        <LocalePicker
          locale={locale}
          onLocaleChange={setLocale}
          disabled={session.isListening}
        />

        <View style={styles.transcript}>
          <TranscriptView
            final={session.final}
            partial={session.partial}
            finalWords={session.finalWords}
            partialWords={session.partialWords}
          />
        </View>

        {session.error ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <ThemedText type="small" themeColor="tintB">
              {session.error.message}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.micRow}>
          <MicButton
            listening={session.isListening}
            disabled={micDisabled}
            onPress={handleMicPress}
          />
        </View>

        <ActionRow
          canCopy={session.final.length > 0}
          onClear={handleClear}
          onCopy={handleCopy}
        />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  transcript: {
    minHeight: 160,
  },
  errorBanner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  micRow: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
