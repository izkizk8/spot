/**
 * TranscriptView — scrollable transcript with confidence shading (US1, T036).
 *
 * - Renders finalized text in primary color, partial appended in muted color
 * - Per-word opacity = clamp(0.4 + 0.6 * (confidence ?? 1.0), 0.4, 1) (FR-009)
 * - Empty placeholder: "Tap the mic to start"
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WordToken } from '@/modules/speech-recognition-lab/speech-types';

export interface TranscriptViewProps {
  final: string;
  partial: string;
  finalWords?: WordToken[];
  partialWords?: WordToken[];
  /** Convenience alias when caller doesn't distinguish layers. */
  words?: WordToken[];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function wordOpacity(w: WordToken): number {
  const c = w.confidence ?? 1.0;
  return clamp(0.4 + 0.6 * c, 0.4, 1);
}

function renderWords(words: WordToken[] | undefined, color: string) {
  if (!words || words.length === 0) return null;
  return (
    <>
      {words.map((w, i) => (
        <Text
          key={`${w.word}-${i}`}
          style={{ color, opacity: wordOpacity(w) }}
        >
          {(i > 0 ? ' ' : '') + w.word}
        </Text>
      ))}
    </>
  );
}

export default function TranscriptView({
  final,
  partial,
  finalWords,
  partialWords,
  words,
}: TranscriptViewProps) {
  const theme = useTheme();
  const isEmpty = !final && !partial;

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <ThemedText type="default" themeColor="textSecondary" style={styles.placeholder}>
          Tap the mic to start
        </ThemedText>
      </View>
    );
  }

  // Treat `words` as a partial-layer alias when neither finalWords nor partialWords given.
  const effectivePartialWords = partialWords ?? (finalWords ? undefined : words);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.line}>
        {finalWords && finalWords.length > 0 ? (
          renderWords(finalWords, theme.text)
        ) : (
          <Text style={{ color: theme.text }}>{final}</Text>
        )}
        {final && partial ? <Text style={{ color: theme.text }}>{' '}</Text> : null}
        {effectivePartialWords && effectivePartialWords.length > 0 ? (
          renderWords(effectivePartialWords, theme.textSecondary)
        ) : (
          <Text style={{ color: theme.textSecondary }}>{partial}</Text>
        )}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
  },
  content: {
    paddingBottom: Spacing.four,
  },
  line: {
    fontSize: 18,
    lineHeight: 26,
  },
  placeholder: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
