/**
 * SampleImageCard Component
 * Feature: 080-live-text
 *
 * Provides a demo base64 image and a Recognise button to trigger OCR.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/** Tiny 1×1 white PNG as a placeholder base64 image for demo purposes. */
const DEMO_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

interface SampleImageCardProps {
  loading: boolean;
  onRecognize: (base64: string) => void;
  style?: ViewStyle;
}

export default function SampleImageCard({ loading, onRecognize, style }: SampleImageCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Sample Image OCR</ThemedText>
      <ThemedText style={styles.description}>
        Tap Recognise to run VNRecognizeTextRequest on a demo image. On a real device the bridge
        calls Vision and returns text blocks with confidence scores.
      </ThemedText>
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => {
          onRecognize(DEMO_BASE64);
        }}
        disabled={loading}
        accessibilityRole='button'
        accessibilityLabel='Recognise text in sample image'
      >
        <ThemedText style={styles.buttonLabel}>{loading ? 'Recognising…' : 'Recognise'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: Spacing.two,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
