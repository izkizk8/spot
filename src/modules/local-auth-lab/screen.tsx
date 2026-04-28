/**
 * Local Authentication — iOS + Android screen (feature 022).
 *
 * Composes: CapabilitiesCard, AuthOptionsPanel, ResultCard, SecureNoteCard,
 * HistoryLog. Uses useBiometricAuth to drive the biometric flow and the
 * secure-note-store for persistence.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { useBiometricAuth, type UseBiometricAuthOptions } from './hooks/useBiometricAuth';
import { getStoredNote, setStoredNote, clearStoredNote } from './secure-note-store';
import CapabilitiesCard from './components/CapabilitiesCard';
import AuthOptionsPanel, { type AuthOptionsValue } from './components/AuthOptionsPanel';
import ResultCard from './components/ResultCard';
import SecureNoteCard from './components/SecureNoteCard';
import HistoryLog from './components/HistoryLog';

export interface LocalAuthScreenProps {
  overrides?: UseBiometricAuthOptions;
  noteStoreOverride?: {
    get: () => Promise<string | null>;
    set: (v: string) => Promise<void>;
    clear: () => Promise<void>;
  };
}

export default function LocalAuthScreen({
  overrides,
  noteStoreOverride,
}: LocalAuthScreenProps = {}) {
  const auth = useBiometricAuth(overrides);

  const noteStore = React.useMemo(
    () =>
      noteStoreOverride ?? {
        get: getStoredNote,
        set: setStoredNote,
        clear: clearStoredNote,
      },
    [noteStoreOverride],
  );

  const [options, setOptions] = React.useState<AuthOptionsValue>({
    promptMessage: 'Authenticate to continue',
    fallbackLabel: '',
    cancelLabel: '',
    disableDeviceFallback: false,
  });

  const [draft, setDraft] = React.useState('');
  const [storedNote, setStoredNoteState] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void noteStore.get().then((value) => {
      if (!cancelled) setStoredNoteState(value);
    });
    return () => {
      cancelled = true;
    };
  }, [noteStore]);

  const handleAuthenticate = React.useCallback(() => {
    void auth.authenticate({
      promptMessage: options.promptMessage,
      fallbackLabel: options.fallbackLabel,
      cancelLabel: options.cancelLabel,
      disableDeviceFallback: options.disableDeviceFallback,
    });
  }, [auth, options]);

  const handleSave = React.useCallback(async () => {
    await noteStore.set(draft);
    setStoredNoteState(draft);
    setRevealed(false);
  }, [draft, noteStore]);

  const handleView = React.useCallback(async () => {
    const attempt = await auth.authenticate({
      promptMessage: 'Authenticate to view your secure note',
      fallbackLabel: options.fallbackLabel,
      cancelLabel: options.cancelLabel,
      disableDeviceFallback: options.disableDeviceFallback,
    });
    if (attempt.success) setRevealed(true);
  }, [auth, options]);

  const handleClear = React.useCallback(async () => {
    await noteStore.clear();
    setStoredNoteState(null);
    setRevealed(false);
  }, [noteStore]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilitiesCard capabilities={auth.capabilities} onRefresh={auth.refreshCapabilities} />
        <AuthOptionsPanel
          value={options}
          onChange={setOptions}
          onAuthenticate={handleAuthenticate}
        />
        <ResultCard result={auth.lastResult} />
        <SecureNoteCard
          draft={draft}
          onDraftChange={setDraft}
          storedNote={storedNote}
          revealed={revealed}
          onSave={handleSave}
          onView={handleView}
          onClear={handleClear}
        />
        <HistoryLog history={auth.history} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
});
