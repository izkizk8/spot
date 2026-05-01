/**
 * Documents Lab Screen — iOS variant.
 * feature 032 / T044.
 *
 * Panels in fixed order: PickDocumentsCard -> BundledSamplesCard ->
 * TypeFilterControl -> FilesList.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import BundledSamplesCard from './components/BundledSamplesCard';
import FilesList from './components/FilesList';
import PickDocumentsCard from './components/PickDocumentsCard';
import TypeFilterControl from './components/TypeFilterControl';
import { usePickedDocuments } from './hooks/usePickedDocuments';

export default function DocumentsLabScreen() {
  const { files, visibleFiles, filter, add, remove, setFilter } = usePickedDocuments();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PickDocumentsCard filter={filter} onAdd={add} style={styles.card} />
      <BundledSamplesCard onAdd={add} style={styles.card} />
      <TypeFilterControl value={filter} onChange={setFilter} style={styles.card} />
      <FilesList
        entries={files.length === 0 ? [] : visibleFiles}
        filter={filter}
        onRemove={remove}
        style={styles.card}
      />
    </ScrollView>
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
    overflow: 'hidden',
  },
});
