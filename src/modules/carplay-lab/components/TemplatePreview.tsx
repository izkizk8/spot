/**
 * TemplatePreview — CarPlay Lab (feature 045).
 *
 * Pure RN mock of a CarPlay screen: a 16:10 dark canvas with the
 * template's name, className, and short example body. Strictly
 * presentational — never touches the native bridge. Updates when the
 * `kind` prop changes.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CarPlayTemplateKind } from '@/native/carplay.types';

import { findCarPlayTemplate } from '../templates-catalog';

interface TemplatePreviewProps {
  readonly style?: ViewStyle;
  readonly kind: CarPlayTemplateKind;
}

export default function TemplatePreview({ style, kind }: TemplatePreviewProps) {
  const template = findCarPlayTemplate(kind);

  return (
    <ThemedView style={[styles.container, style]} testID='carplay-template-preview'>
      <ThemedText style={styles.heading}>Mock preview</ThemedText>
      <View style={styles.canvas} testID={`carplay-preview-canvas-${kind}`}>
        <View style={styles.canvasHeader}>
          <ThemedText style={styles.canvasTitle} themeColor='text'>
            {template?.label ?? kind}
          </ThemedText>
          <ThemedText style={styles.canvasClass} themeColor='textSecondary'>
            {template?.className ?? '—'}
          </ThemedText>
        </View>
        <View style={styles.canvasBody}>
          {(template?.previewLines ?? ['(no template)']).map((line, idx) => (
            <ThemedText
              key={`${kind}-${idx}`}
              style={styles.canvasLine}
              testID={`carplay-preview-line-${idx}`}
            >
              {line}
            </ThemedText>
          ))}
        </View>
      </View>
      {template?.summary != null && (
        <ThemedText type='small' themeColor='textSecondary'>
          {template.summary}
        </ThemedText>
      )}
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
  canvas: {
    aspectRatio: 16 / 10,
    backgroundColor: '#1c1c1e',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canvasTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  canvasClass: {
    color: '#aeaeb2',
    fontSize: 12,
  },
  canvasBody: {
    flex: 1,
    gap: Spacing.one,
  },
  canvasLine: {
    color: '#f2f2f7',
    fontSize: 14,
  },
});
