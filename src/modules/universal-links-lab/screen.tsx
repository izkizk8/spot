/**
 * Universal Links Lab — iOS screen — feature 041.
 *
 * Composes ExplainerCard, DomainsList, TestComposer, AASAPreviewCard,
 * SetupInstructions, and InvocationsLog. Reads associatedDomains and
 * bundleIdentifier from app.json at module load time.
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AASAPreviewCard from './components/AASAPreviewCard';
import DomainsList from './components/DomainsList';
import ExplainerCard from './components/ExplainerCard';
import InvocationsLog from './components/InvocationsLog';
import SetupInstructions from './components/SetupInstructions';
import TestComposer from './components/TestComposer';
import { useUniversalLinks } from './hooks/useUniversalLinks';

interface AppJson {
  expo: {
    ios?: {
      bundleIdentifier?: string;
      associatedDomains?: readonly string[];
    };
  };
}

const appJson = require('../../../app.json') as AppJson;
const BUNDLE_ID = appJson.expo.ios?.bundleIdentifier ?? 'com.example.app';
const DOMAINS: readonly string[] = appJson.expo.ios?.associatedDomains ?? [];

export default function UniversalLinksLabScreen() {
  const { log, clear, dispatch } = useUniversalLinks();
  const [lastEchoed, setLastEchoed] = useState<string | undefined>(undefined);

  const handleDispatch = useCallback(
    (url: string) => {
      void dispatch(url)
        .then(() => {
          setLastEchoed(url);
        })
        .catch(() => {
          // Swallow Linking errors; user retains the URL in the input.
        });
    },
    [dispatch],
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ExplainerCard style={styles.card} />
        <DomainsList style={styles.card} domains={DOMAINS} />
        <TestComposer style={styles.card} onDispatch={handleDispatch} lastEchoedUrl={lastEchoed} />
        <AASAPreviewCard style={styles.card} bundleIdentifier={BUNDLE_ID} />
        <SetupInstructions style={styles.card} />
        <InvocationsLog style={styles.card} events={log} onClear={clear} />
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
  card: {
    overflow: 'hidden',
  },
});
