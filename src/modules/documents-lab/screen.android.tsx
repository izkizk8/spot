/**
 * Documents Lab Screen — Android variant.
 * feature 032 / T045.
 *
 * Same panels as iOS + IOSOnlyBanner + QuickLookFallback above the
 * (absent) Quick Look section.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import BundledSamplesCard from './components/BundledSamplesCard';
import FilesList from './components/FilesList';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import PickDocumentsCard from './components/PickDocumentsCard';
import QuickLookFallback from './components/QuickLookFallback';
import TypeFilterControl from './components/TypeFilterControl';
import { usePickedDocuments } from './hooks/usePickedDocuments';

export default function DocumentsLabScreenAndroid() {
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
      <IOSOnlyBanner style={styles.card} />
      <QuickLookFallback style={styles.card} />
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
