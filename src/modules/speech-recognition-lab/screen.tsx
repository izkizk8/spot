/**
 * Speech Recognition Lab — iOS screen (US1, T041; US2 T046; US3 T051; US4 T056).
 *
 * Composes AuthStatusPill, AudioSessionIndicator, RecognitionModePicker,
 * LocalePicker, TranscriptView, MicButton, ActionRow into the FR-005
 * vertical layout. Wires `useSpeechSession` and expo-clipboard.
 */

import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
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
    const sys = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().locale as string | undefined;
    if (sys && (TOP_LOCALES as readonly string[]).includes(sys)) return sys;
  } catch {
    // ignore
  }
  return 'en-US';
}

function probeOnDeviceSupport(loc: Locale): boolean {
  const probe = (bridge as any).supportsOnDeviceRecognition;
  if (typeof probe !== 'function') return false;
  try {
    return probe.call(bridge, loc) === true;
  } catch {
    return false;
  }
}

export default function SpeechRecognitionLabScreen() {
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>('notDetermined');
  const [mode, setMode] = React.useState<RecognitionMode>('server');
  const [locale, setLocale] = React.useState<Locale>(resolveSystemLocale());
  const [availableLocales, setAvailableLocales] = React.useState<Locale[] | undefined>(undefined);
  const [onDeviceAvailable, setOnDeviceAvailable] = React.useState<boolean>(() =>
    probeOnDeviceSupport(resolveSystemLocale()),
  );
  const [inlineNotice, setInlineNotice] = React.useState<string | null>(null);

  const session = useSpeechSession();

  // Keep latest values inside async sequences (mode/locale change while listening).
  const stateRef = React.useRef({ mode, locale });
  React.useEffect(() => {
    stateRef.current = { mode, locale };
  }, [mode, locale]);

  // Initial authorization probe + locale enumeration.
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
    try {
      const locales = bridge.availableLocales();
      if (Array.isArray(locales) && locales.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAvailableLocales(locales);
      }
    } catch {
      // ignore
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Recompute on-device support whenever locale changes.
  const showNotice = React.useCallback((msg: string) => {
    setInlineNotice(msg);
    setTimeout(() => setInlineNotice(null), 3000);
  }, []);

  React.useEffect(() => {
    const supported = probeOnDeviceSupport(locale);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnDeviceAvailable(supported);
    // Auto-fallback: if on-device mode selected but locale doesn't support it.
    if (!supported && mode === 'on-device') {
      setMode('server');
      showNotice(`Switched to Server: on-device unavailable for ${locale}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, showNotice]);

  const handleRequestAuth = React.useCallback(async () => {
    try {
      const next = await bridge.requestAuthorization();
      setAuthStatus(next);
    } catch {
      // SpeechRecognitionNotSupported on non-iOS — leave status as is.
    }
  }, []);

  const handleOpenSettings = React.useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      showNotice('Could not open Settings');
    }
  }, [showNotice]);

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

  const handleModeChange = React.useCallback(
    (newMode: RecognitionMode) => {
      setMode(newMode);
      if (session.isListening) {
        const { locale: currentLocale } = stateRef.current;
        (async () => {
          await session.stop();
          try {
            await session.start({
              locale: currentLocale,
              onDevice: newMode === 'on-device',
            });
          } catch {
            // surfaced via session.error
          }
        })();
      }
    },
    [session],
  );

  const handleLocaleChange = React.useCallback(
    (newLocale: Locale) => {
      // Validate via bridge.isAvailable; revert + inline error if unsupported.
      let available = true;
      try {
        available = bridge.isAvailable(newLocale);
      } catch {
        available = true;
      }
      if (!available) {
        showNotice(`Recognition not available for ${newLocale} on this device`);
        return;
      }
      setLocale(newLocale);
      if (session.isListening) {
        const { mode: currentMode } = stateRef.current;
        (async () => {
          await session.stop();
          try {
            await session.start({
              locale: newLocale,
              onDevice: currentMode === 'on-device',
            });
          } catch {
            // surfaced via session.error
          }
        })();
      }
    },
    [session, showNotice],
  );

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
          <AuthStatusPill
            status={authStatus}
            onRequestPress={handleRequestAuth}
            onOpenSettingsPress={handleOpenSettings}
          />
          <AudioSessionIndicator active={session.isListening} />
        </View>

        {micDisabled && (authStatus === 'denied' || authStatus === 'restricted') ? (
          <View style={styles.errorBanner} accessibilityRole='alert'>
            <ThemedText type='small' themeColor='tintB'>
              Microphone access required — open Settings to enable.
            </ThemedText>
          </View>
        ) : null}

        <RecognitionModePicker
          mode={mode}
          onDeviceAvailable={onDeviceAvailable}
          onModeChange={handleModeChange}
        />

        <LocalePicker
          locale={locale}
          availableLocales={availableLocales}
          onLocaleChange={handleLocaleChange}
        />

        <View style={styles.transcript}>
          <TranscriptView
            final={session.final}
            partial={session.partial}
            finalWords={session.finalWords}
            partialWords={session.partialWords}
          />
        </View>

        {inlineNotice ? (
          <View style={styles.errorBanner} accessibilityRole='alert'>
            <ThemedText type='small' themeColor='textSecondary'>
              {inlineNotice}
            </ThemedText>
          </View>
        ) : null}

        {session.error ? (
          <View style={styles.errorBanner} accessibilityRole='alert'>
            <ThemedText type='small' themeColor='tintB'>
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

        <ActionRow canCopy={session.final.length > 0} onClear={handleClear} onCopy={handleCopy} />
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
