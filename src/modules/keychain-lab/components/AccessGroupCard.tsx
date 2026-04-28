/**
 * AccessGroupCard — explains keychain access groups and probes the
 * resolved access-group string. Surfaces typed bridge results inline:
 *
 *   - 'ok'                  → "Read N bytes from the shared keychain."
 *   - 'cancelled'           → "Probe cancelled."
 *   - 'missing-entitlement' → "This build is missing the keychain-access-groups entitlement."
 *   - 'unsupported'         → "Access groups are not supported in this environment."
 *
 * Never throws and never calls `console.error` (NFR-005, NFR-006, SC-005).
 *
 * Covers FR-018, US4-AS1–AS3.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { tryAccessGroupProbe } from '../keychain-store';
import type { KeychainResult } from '../types';

interface AccessGroupCardProps {
  accessGroup: string;
}

type ProbeResult = KeychainResult<{ bytes: number }>;

function inlineMessage(result: ProbeResult): string {
  switch (result.kind) {
    case 'ok':
      return `Read ${result.value?.bytes ?? 0} bytes from the shared keychain.`;
    case 'cancelled':
      return 'Probe cancelled.';
    case 'missing-entitlement':
      return 'This build is missing the keychain-access-groups entitlement — add it to the app entitlements to enable shared keychain reads.';
    case 'unsupported':
      return 'Access groups are not supported in this environment.';
    case 'auth-failed':
      return 'Authentication failed.';
    case 'not-found':
      return 'No item found in the shared keychain.';
    case 'error':
      return `Probe failed: ${result.message}`;
  }
}

export default function AccessGroupCard({ accessGroup }: AccessGroupCardProps) {
  const theme = useTheme();
  const [probing, setProbing] = useState(false);
  const [result, setResult] = useState<ProbeResult | null>(null);

  async function handleTry() {
    setProbing(true);
    setResult(null);
    const probe = await tryAccessGroupProbe(accessGroup);
    setProbing(false);
    setResult(probe);
  }

  return (
    <ThemedView style={styles.container} type="backgroundElement">
      <ThemedText type="smallBold" style={styles.heading}>
        Keychain access group
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.explainer}>
        Access groups let multiple apps from the same team share keychain items. The resolved
        identifier below is read at runtime; tap Try to probe it through the bridge.
      </ThemedText>

      <ThemedView style={styles.codeBlock} type="backgroundSelected">
        <ThemedText type="code" style={styles.codeText}>
          {accessGroup}
        </ThemedText>
      </ThemedView>

      <Pressable
        testID="access-group-try"
        accessibilityRole="button"
        onPress={handleTry}
        disabled={probing}
        style={[styles.button, { backgroundColor: theme.tintA, opacity: probing ? 0.6 : 1 }]}
      >
        {probing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText type="default" style={styles.buttonText}>
            Try shared keychain
          </ThemedText>
        )}
      </Pressable>

      {result && (
        <ThemedView style={styles.resultBox} type="backgroundSelected">
          <ThemedText
            type="small"
            themeColor={result.kind === 'ok' ? 'text' : 'textSecondary'}
            style={styles.resultText}
          >
            {inlineMessage(result)}
          </ThemedText>
        </ThemedView>
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
  heading: {
    marginBottom: Spacing.one,
  },
  explainer: {
    lineHeight: 18,
  },
  codeBlock: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  codeText: {
    fontFamily: 'monospace',
  },
  button: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  resultText: {
    lineHeight: 18,
  },
});
