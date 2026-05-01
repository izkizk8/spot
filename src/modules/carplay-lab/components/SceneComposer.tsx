/**
 * SceneComposer — CarPlay Lab (feature 045).
 *
 * Lists the five CarPlay templates and lets the user pick one. The
 * picked template id is hoisted to the parent screen which mounts
 * the corresponding TemplatePreview. Stateless — selection is
 * controlled.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CarPlayCategory, CarPlayTemplateKind } from '@/native/carplay.types';

import {
  CARPLAY_TEMPLATES,
  isTemplateAllowedForCategory,
  type CarPlayTemplate,
} from '../templates-catalog';

interface SceneComposerProps {
  readonly style?: ViewStyle;
  readonly category: CarPlayCategory;
  readonly selectedKind: CarPlayTemplateKind;
  readonly onSelect: (kind: CarPlayTemplateKind) => void;
}

export default function SceneComposer({
  style,
  category,
  selectedKind,
  onSelect,
}: SceneComposerProps) {
  const handleSelect = useCallback((kind: CarPlayTemplateKind) => () => onSelect(kind), [onSelect]);

  return (
    <ThemedView style={[styles.container, style]} testID='carplay-scene-composer'>
      <ThemedText style={styles.heading}>Scene composer</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Pick a template to preview which CarPlay surface this app would mount. Templates disallowed
        by your declared category are dimmed.
      </ThemedText>
      <View style={styles.list}>
        {CARPLAY_TEMPLATES.map((t: CarPlayTemplate) => {
          const allowed = isTemplateAllowedForCategory(t, category);
          const selected = t.kind === selectedKind;
          return (
            <Pressable
              key={t.kind}
              onPress={handleSelect(t.kind)}
              accessibilityRole='button'
              accessibilityState={{ selected }}
              testID={`carplay-template-option-${t.kind}`}
              style={[styles.row, selected && styles.rowSelected, !allowed && styles.rowDisallowed]}
            >
              <ThemedText type='smallBold'>{t.label}</ThemedText>
              <ThemedText type='small' themeColor='textSecondary'>
                {t.className}
              </ThemedText>
              {!allowed && (
                <ThemedText
                  type='small'
                  themeColor='tintB'
                  testID={`carplay-template-warn-${t.kind}`}
                >
                  Not permitted for category &quot;{category}&quot;
                </ThemedText>
              )}
            </Pressable>
          );
        })}
      </View>
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
  list: {
    gap: Spacing.one,
  },
  row: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    gap: 4,
  },
  rowSelected: {
    backgroundColor: 'rgba(255,149,0,0.12)',
  },
  rowDisallowed: {
    opacity: 0.5,
  },
});
