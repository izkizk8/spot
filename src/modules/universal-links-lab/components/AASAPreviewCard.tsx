/**
 * AASAPreviewCard — Universal Links Lab (feature 041).
 *
 * Renders a recommended apple-app-site-association JSON preview for
 * the current bundle identifier and offers a "Copy JSON" button.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { aasaToJsonString, buildAASA } from '../aasa-template';

interface AASAPreviewCardProps {
  readonly bundleIdentifier: string;
  readonly teamId?: string;
  readonly style?: ViewStyle;
}

export default function AASAPreviewCard({ bundleIdentifier, teamId, style }: AASAPreviewCardProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => {
    const doc = buildAASA({ bundleIdentifier, teamId });
    return aasaToJsonString(doc);
  }, [bundleIdentifier, teamId]);

  const handleCopy = () => {
    void Clipboard.setStringAsync(json)
      .then(() => {
        setCopied(true);
      })
      .catch(() => {
        // Surface no error UI; the card stays in idle state.
      });
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>AASA Preview</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Host this JSON at {`https://your-domain/.well-known/apple-app-site-association`}, served as
        application/json with no redirects. Replace TEAMID with your Apple Developer Team ID.
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.code, { backgroundColor: theme.backgroundElement }]}
        testID="aasa-json-block"
      >
        {json}
      </ThemedText>
      <Pressable
        onPress={handleCopy}
        testID="copy-aasa-btn"
        style={[styles.copyBtn, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type="smallBold" themeColor="background">
          {copied ? 'Copied ✓' : 'Copy JSON'}
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
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 12,
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  copyBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
});
