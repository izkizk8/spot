/**
 * OCRResultCard Component
 * Feature: 080-live-text
 *
 * Displays the recognised text blocks from a Vision OCR pass.
 */

import React from 'react';
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { OCRResult } from '@/native/live-text.types';

interface OCRResultCardProps {
  result: OCRResult | null;
  style?: ViewStyle;
}

export default function OCRResultCard({ result, style }: OCRResultCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>OCR Result</ThemedText>
      {result === null ? (
        <ThemedText style={styles.placeholder}>
          No result yet. Tap Recognise on an image.
        </ThemedText>
      ) : (
        <>
          <ThemedText style={styles.timestamp}>Recognised at: {result.recognisedAt}</ThemedText>
          <ThemedText style={styles.label}>Full Text:</ThemedText>
          <ScrollView style={styles.scroll}>
            <ThemedText style={styles.fullText}>{result.fullText}</ThemedText>
          </ScrollView>
          <ThemedText style={styles.label}>Blocks ({result.blocks.length}):</ThemedText>
          {result.blocks.map((block, i) => (
            <ThemedView key={i} style={styles.block}>
              <ThemedText style={styles.blockText}>{block.text}</ThemedText>
              <ThemedText style={styles.confidence}>
                Confidence: {(block.confidence * 100).toFixed(1)}%
              </ThemedText>
            </ThemedView>
          ))}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    fontSize: 14,
    opacity: 0.6,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  scroll: {
    maxHeight: 80,
  },
  fullText: {
    fontSize: 14,
  },
  block: {
    padding: Spacing.one,
    gap: 2,
  },
  blockText: {
    fontSize: 14,
  },
  confidence: {
    fontSize: 12,
    opacity: 0.7,
  },
});
