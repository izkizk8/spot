/**
 * Local Authentication — Web screen (feature 022).
 *
 * Banner + disabled UI; never instantiates the hook and never invokes the
 * bridge. Mirrors the 021 web pattern.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import IOSOnlyBanner from './components/IOSOnlyBanner';
import CapabilitiesCard from './components/CapabilitiesCard';
import AuthOptionsPanel, { type AuthOptionsValue } from './components/AuthOptionsPanel';
import ResultCard from './components/ResultCard';
import SecureNoteCard from './components/SecureNoteCard';
import HistoryLog from './components/HistoryLog';

const noop = () => {};
const noopVoid = (..._args: never[]) => {};

export default function LocalAuthScreen() {
  const [options, setOptions] = React.useState<AuthOptionsValue>({
    promptMessage: '',
    fallbackLabel: '',
    cancelLabel: '',
    disableDeviceFallback: false,
  });
  const [draft, setDraft] = React.useState('');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <IOSOnlyBanner />
        <CapabilitiesCard
          capabilities={{ hasHardware: false, isEnrolled: false, types: [], securityLevel: 0 }}
          onRefresh={noop}
        />
        <AuthOptionsPanel value={options} onChange={setOptions} onAuthenticate={noop} disabled />
        <ResultCard result={null} />
        <SecureNoteCard
          draft={draft}
          onDraftChange={setDraft}
          storedNote={null}
          revealed={false}
          onSave={noopVoid as () => void}
          onView={noopVoid as () => void}
          onClear={noopVoid as () => void}
          disabled
        />
        <HistoryLog history={[]} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
});
