/**
 * SubjectsList Component
 * Feature: 060-visual-look-up
 *
 * Renders the list of subjects detected by VNImageAnalyzer. Each row
 * shows the label, confidence percentage, and bounding box coordinates.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Subject } from '@/native/visual-look-up.types';

interface SubjectsListProps {
  subjects: readonly Subject[];
  loading: boolean;
  style?: ViewStyle;
}

function SubjectRow({ subject }: { subject: Subject }) {
  const pct = Math.round(subject.confidence * 100);
  const bb = subject.boundingBox;
  return (
    <ThemedView style={styles.row}>
      <ThemedText style={styles.label}>{subject.label}</ThemedText>
      <ThemedText style={styles.confidence}>{pct}%</ThemedText>
      <ThemedText style={styles.bbox}>
        ({bb.x.toFixed(2)}, {bb.y.toFixed(2)}) {bb.width.toFixed(2)}×{bb.height.toFixed(2)}
      </ThemedText>
    </ThemedView>
  );
}

export default function SubjectsList({ subjects, loading, style }: SubjectsListProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Detected Subjects</ThemedText>
      {loading ? (
        <ThemedText style={styles.placeholder}>Analysing…</ThemedText>
      ) : subjects.length === 0 ? (
        <ThemedText style={styles.placeholder}>
          No subjects detected yet. Press the button below to start.
        </ThemedText>
      ) : (
        subjects.map((s) => <SubjectRow key={s.id} subject={s} />)
      )}
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
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 14,
    opacity: 0.9,
  },
  bbox: {
    fontSize: 12,
    opacity: 0.6,
  },
  placeholder: {
    fontSize: 14,
    opacity: 0.7,
  },
});
