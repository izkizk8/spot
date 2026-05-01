/**
 * FilterCard Component
 * Feature: 064-core-image
 *
 * Displays the selected filter's metadata, its parameter steppers,
 * and the Apply button.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { FilterId, FilterParams } from '@/native/core-image.types';
import { findFilter } from '../filter-types';

interface FilterCardProps {
  filterId: FilterId;
  params: FilterParams;
  loading: boolean;
  onParamChange: (key: string, value: number) => void;
  onApply: () => void;
  style?: ViewStyle;
}

export default function FilterCard({
  filterId,
  params,
  loading,
  onParamChange,
  onApply,
  style,
}: FilterCardProps) {
  const info = findFilter(filterId);
  if (!info) return null;

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>{info.name}</ThemedText>
      <ThemedText style={styles.description}>{info.description}</ThemedText>
      <ThemedText style={styles.ciName}>{info.ciFilterName}</ThemedText>

      {info.params.map((paramDef) => {
        const currentValue = params[paramDef.key] ?? paramDef.defaultValue;
        const clamp = (v: number) =>
          Math.max(
            paramDef.min,
            Math.min(paramDef.max, Math.round(v / paramDef.step) * paramDef.step),
          );
        return (
          <ThemedView key={paramDef.key} style={styles.paramRow}>
            <ThemedText style={styles.paramLabel}>
              {paramDef.label}: {currentValue.toFixed(2)}
            </ThemedText>
            <ThemedView style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => onParamChange(paramDef.key, clamp(currentValue - paramDef.step))}
                accessibilityLabel={`Decrease ${paramDef.label}`}
              >
                <ThemedText style={styles.stepBtnText}>−</ThemedText>
              </TouchableOpacity>
              <ThemedView style={styles.stepperTrack}>
                <ThemedView
                  style={[
                    styles.stepperFill,
                    {
                      width: `${((currentValue - paramDef.min) / (paramDef.max - paramDef.min)) * 100}%`,
                    },
                  ]}
                />
              </ThemedView>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => onParamChange(paramDef.key, clamp(currentValue + paramDef.step))}
                accessibilityLabel={`Increase ${paramDef.label}`}
              >
                <ThemedText style={styles.stepBtnText}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        );
      })}

      <TouchableOpacity
        style={[styles.applyButton, loading && styles.applyButtonDisabled]}
        onPress={onApply}
        disabled={loading}
        accessibilityRole='button'
        accessibilityLabel='Apply filter'
      >
        {loading ? (
          <ActivityIndicator color='#fff' />
        ) : (
          <ThemedText style={styles.applyText}>Apply Filter</ThemedText>
        )}
      </TouchableOpacity>
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
  description: {
    fontSize: 14,
    opacity: 0.8,
  },
  ciName: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  paramRow: {
    gap: Spacing.one,
  },
  paramLabel: {
    fontSize: 13,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  stepperTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.25)',
    overflow: 'hidden',
  },
  stepperFill: {
    height: 6,
    backgroundColor: 'rgba(0,122,255,0.8)',
    borderRadius: 3,
  },
  applyButton: {
    backgroundColor: 'rgba(0,122,255,0.9)',
    borderRadius: 8,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
