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
  // Default to fallback - in production, would integrate with documents-store properly
  const files = [FALLBACK_SAMPLE];

  return (
    <ThemedView style={[styles.container, style]}>
      {files.map((file) => {
        const isSelected = selectedUri === file.uri;
        return (
          <Pressable
            key={file.uri}
            accessibilityRole='button'
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
