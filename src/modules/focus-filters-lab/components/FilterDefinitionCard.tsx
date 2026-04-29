import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ShowcaseFilterMode } from '@/modules/focus-filters-lab/filter-modes';

// Accent color catalog with hex values
const ACCENT_COLORS = [
  { slug: 'blue', hex: '#007AFF', label: 'Blue' },
  { slug: 'orange', hex: '#FF9500', label: 'Orange' },
  { slug: 'green', hex: '#34C759', label: 'Green' },
  { slug: 'purple', hex: '#AF52DE', label: 'Purple' },
] as const;

const MODE_LABELS: Record<ShowcaseFilterMode, string> = {
  relaxed: 'Relaxed',
  focused: 'Focused',
  quiet: 'Quiet',
};

interface FilterDefinitionCardProps {
  mode: ShowcaseFilterMode;
  accentColor: string;
  onChangeMode: (mode: ShowcaseFilterMode) => void;
  onChangeAccent: (accent: string) => void;
}

export default function FilterDefinitionCard({
  mode,
  accentColor,
  onChangeMode,
  onChangeAccent,
}: FilterDefinitionCardProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Showcase Mode</ThemedText>
      <ThemedText style={styles.description}>
        Customizable focus filter for the spot showcase app
      </ThemedText>

      {/* Mode Segments */}
      <ThemedText style={styles.sectionLabel}>Mode</ThemedText>
      <View style={styles.segmentContainer}>
        {(['relaxed', 'focused', 'quiet'] as const).map((modeValue) => {
          const isSelected = mode === modeValue;
          return (
            <Pressable
              key={modeValue}
              style={[styles.segment, isSelected && styles.segmentSelected]}
              onPress={() => {
                if (!isSelected) {
                  onChangeMode(modeValue);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${MODE_LABELS[modeValue]} mode`}
              accessibilityState={{ selected: isSelected }}
            >
              <ThemedText style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                {MODE_LABELS[modeValue]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Accent Color Swatches */}
      <ThemedText style={styles.sectionLabel}>Accent Color</ThemedText>
      <View style={styles.swatchContainer}>
        {ACCENT_COLORS.map((color) => {
          const isSelected = accentColor === color.slug;
          return (
            <Pressable
              key={color.slug}
              style={[
                styles.swatch,
                { backgroundColor: color.hex },
                isSelected && styles.swatchSelected,
              ]}
              onPress={() => {
                if (!isSelected) {
                  onChangeAccent(color.slug);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${color.label} accent`}
            />
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
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.three,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  segmentSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF20',
  },
  segmentText: {
    fontSize: 14,
  },
  segmentTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  swatchContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#000',
  },
});
