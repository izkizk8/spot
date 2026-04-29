/**
 * FileRow — feature 032 / T035.
 *
 * Single document row with Preview / Share / Delete actions.
 * Imports `quicklook` lazily via `Platform.select` so non-iOS bundles
 * do not pull in the iOS bridge runtime.
 */

import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { bridge as quickLookBridge } from '@/native/quicklook';

import { formatSize } from '../mime-types';
import type { DocumentEntry } from '../documents-store';
import QuickLookFallback from './QuickLookFallback';

interface FileRowProps {
  readonly entry: DocumentEntry;
  readonly onRemove: (id: string) => void;
  readonly style?: ViewStyle;
}

export default function FileRow({ entry, onRemove, style }: FileRowProps) {
  const [showFallback, setShowFallback] = useState(false);

  const handlePreview = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setShowFallback(true);
      return;
    }
    try {
      await quickLookBridge.present(entry.uri);
    } catch {
      setShowFallback(true);
    }
  }, [entry.uri]);

  const handleShare = useCallback(async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(entry.uri);
      }
    } catch {
      // Swallow — share failures are non-fatal in the showcase.
    }
  }, [entry.uri]);

  const handleDelete = useCallback(() => {
    onRemove(entry.id);
  }, [entry.id, onRemove]);

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedView style={styles.meta}>
        <ThemedText style={styles.name}>{entry.name}</ThemedText>
        <ThemedText style={styles.sub}>
          {entry.mimeType} · {formatSize(entry.size)}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handlePreview()}
          style={[styles.button, styles.previewButton]}
        >
          <ThemedText style={styles.buttonText}>Preview</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleShare()}
          style={[styles.button, styles.shareButton]}
        >
          <ThemedText style={styles.buttonText}>Share</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleDelete}
          style={[styles.button, styles.deleteButton]}
        >
          <ThemedText style={styles.deleteText}>Delete</ThemedText>
        </Pressable>
      </ThemedView>
      {showFallback ? (
        <QuickLookFallback onShare={() => void handleShare()} style={styles.fallback} />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  meta: {
    gap: Spacing.half,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  sub: {
    fontSize: 12,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  previewButton: {
    backgroundColor: '#007AFF',
  },
  shareButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
  fallback: {
    marginTop: Spacing.two,
  },
});
