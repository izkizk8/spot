/**
 * PickDocumentsCard — feature 032 / T032.
 *
 * CTA that opens the system document picker via expo-document-picker.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { mimeFromExtension, pickerTypeForFilter, type DocumentFilter } from '../mime-types';
import type { DocumentEntry } from '../documents-store';

interface PickDocumentsCardProps {
  readonly filter: DocumentFilter;
  readonly onAdd: (entry: DocumentEntry) => void;
  readonly onError?: (err: Error) => void;
  readonly style?: ViewStyle;
}

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `pick-${Date.now()}-${nextId}`;
}

export default function PickDocumentsCard({
  filter,
  onAdd,
  onError,
  style,
}: PickDocumentsCardProps) {
  const handlePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: pickerTypeForFilter(filter),
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const assets = result.assets ?? [];
      for (const asset of assets) {
        const mimeType = asset.mimeType ?? mimeFromExtension(asset.name ?? '');
        const entry: DocumentEntry = {
          id: makeId(),
          name: asset.name ?? 'untitled',
          uri: asset.uri,
          mimeType,
          size: typeof asset.size === 'number' ? asset.size : 0,
          addedAt: new Date().toISOString(),
          source: 'picker',
        };
        onAdd(entry);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [filter, onAdd, onError]);

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Pick a document</ThemedText>
      <ThemedText style={styles.body}>
        Choose any file from the system Files app. Filter selection narrows the picker.
      </ThemedText>
      <Pressable accessibilityRole="button" onPress={handlePick} style={styles.button}>
        <ThemedText style={styles.buttonText}>Open documents</ThemedText>
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
  body: {
    fontSize: 13,
    opacity: 0.8,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
