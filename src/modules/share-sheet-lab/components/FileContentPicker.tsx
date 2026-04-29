/**
 * FileContentPicker — feature 033 / T027.
 *
 * Reads documents-store defensively per R-E. When unavailable/empty,
 * renders only the bundled fallback row.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Defensive import - documents-store may not be available
let useDocumentsStore: any = null;
try {
  useDocumentsStore = require('@/modules/documents-lab/documents-store').useDocumentsStore;
} catch {
  // Documents store not available
}

interface FileContentPickerProps {
  readonly selectedUri: string | null;
  readonly onSelect: (file: { uri: string; name: string; mimeType: string; size: number }) => void;
  readonly style?: ViewStyle;
}

// Bundled fallback sample (from specs/033-share-sheet/tasks.md T007)
const FALLBACK_SAMPLE = {
  uri: 'file://sample.txt',
  name: 'sample.txt',
  mimeType: 'text/plain',
  size: 27,
};

export default function FileContentPicker({
  selectedUri,
  onSelect,
  style,
}: FileContentPickerProps) {
  // Try to read documents store
  const documentsState = useDocumentsStore ? useDocumentsStore() : null;
  const documents = documentsState?.documents ?? [];

  // Use documents if available, else fallback
  const files = documents.length > 0 ? documents : [FALLBACK_SAMPLE];

  return (
    <ThemedView style={[styles.container, style]}>
      {files.map((file) => {
        const isSelected = selectedUri === file.uri;
        return (
          <Pressable
            key={file.uri}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(file)}
            style={[styles.row, isSelected && styles.rowSelected]}
          >
            <ThemedText style={styles.name}>{file.name}</ThemedText>
            <ThemedText style={styles.meta}>
              {(file.size / 1024).toFixed(1)} KB · {file.mimeType}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rowSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
  },
  meta: {
    fontSize: 12,
    marginTop: Spacing.half,
    opacity: 0.6,
  },
});
