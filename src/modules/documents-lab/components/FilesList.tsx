/**
 * FilesList — feature 032 / T034.
 *
 * Renders the visible (filtered) entries via FileRow with newest-first order.
 * Renders a filter-aware empty state line when nothing matches.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { DocumentEntry } from '../documents-store';
import type { DocumentFilter } from '../mime-types';
import FileRow from './FileRow';

interface FilesListProps {
  readonly entries: readonly DocumentEntry[];
  readonly filter: DocumentFilter;
  readonly onRemove: (id: string) => void;
  readonly style?: ViewStyle;
}

const EMPTY_COPY: Record<DocumentFilter, string> = {
  all: 'No files yet',
  images: 'No image files in your list',
  text: 'No text files in your list',
  pdf: 'No PDF files in your list',
};

export default function FilesList({ entries, filter, onRemove, style }: FilesListProps) {
  if (entries.length === 0) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText style={styles.empty}>{EMPTY_COPY[filter]}</ThemedText>
      </ThemedView>
    );
  }

  const ordered = entries.toReversed();

  return (
    <ThemedView style={[styles.container, style]}>
      {ordered.map((entry) => (
        <FileRow key={entry.id} entry={entry} onRemove={onRemove} style={styles.row} />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  empty: {
    padding: Spacing.three,
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
  },
  row: {},
});
