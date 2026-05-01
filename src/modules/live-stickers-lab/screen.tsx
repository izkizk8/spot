/**
 * Live Stickers Lab — iOS screen (feature 083).
 *
 * Demonstrates VNGenerateForegroundInstanceMaskRequest subject lift via a
 * photo picker. Shows lifted subject thumbnails and a share button per
 * subject.
 */

import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { useLiveStickers } from './hooks/useLiveStickers';

export default function LiveStickersLabScreen() {
  const { isSupported, result, error, isLoading, pickAndLift, shareSticker, reset } =
    useLiveStickers();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.title}>Live Stickers</ThemedText>
          <ThemedText style={styles.subtitle}>
            {isSupported
              ? 'Subject lift via VNGenerateForegroundInstanceMaskRequest (iOS 17+)'
              : 'Not supported on this device'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <TouchableOpacity
            style={[styles.button, (!isSupported || isLoading) && styles.buttonDisabled]}
            onPress={() => void pickAndLift()}
            disabled={!isSupported || isLoading}
            testID='pick-photo-button'
          >
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Processing…' : 'Pick Photo'}
            </ThemedText>
          </TouchableOpacity>

          {result !== null && result.subjects.length > 0 && (
            <TouchableOpacity style={styles.resetButton} onPress={reset} testID='reset-button'>
              <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {error !== null && (
          <ThemedView style={styles.card} testID='error-card'>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        )}

        {result !== null && result.subjects.length === 0 && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.emptyText}>No subjects found in this photo.</ThemedText>
          </ThemedView>
        )}

        {result !== null &&
          result.subjects.map((subject, index) => (
            <ThemedView key={index} style={styles.card} testID={`subject-card-${index}`}>
              <Image
                source={{ uri: `data:image/png;base64,${subject.base64Png}` }}
                style={styles.subjectImage}
                resizeMode='contain'
                testID={`subject-image-${index}`}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={() => void shareSticker(subject.base64Png)}
                disabled={isLoading}
                testID={`share-button-${index}`}
              >
                <ThemedText style={styles.buttonText}>Share Sticker</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ))}
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
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resetButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },
  subjectImage: {
    width: '100%',
    height: 200,
  },
});
