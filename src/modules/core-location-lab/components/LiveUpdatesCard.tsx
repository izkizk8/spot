/**
 * LiveUpdatesCard component (feature 025).
 *
 * Start/Stop toggle, accuracy selector, distance filter selector, and readout.
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ACCURACY_PRESETS } from '../accuracy-presets';
import { DISTANCE_FILTERS } from '../distance-filters';
import { useLocationUpdates } from '../hooks/useLocationUpdates';

import { LocationReadout } from './LocationReadout';

export function LiveUpdatesCard() {
  const {
    isRunning,
    latest,
    samplesPerMinute,
    start,
    stop,
    setAccuracy,
    setDistanceFilter,
    accuracy,
    distanceFilter,
    error,
  } = useLocationUpdates();

  const handleToggle = () => {
    if (isRunning) {
      void stop();
    } else {
      void start();
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="subtitle" style={styles.title}>
        Live Updates
      </ThemedText>

      {/* Start/Stop Toggle */}
      <ThemedView style={styles.toggleRow}>
        <Pressable
          onPress={handleToggle}
          style={[styles.toggleButton, isRunning && styles.toggleButtonActive]}
        >
          <ThemedText style={styles.toggleButtonText}>{isRunning ? 'Stop' : 'Start'}</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Accuracy Selector */}
      <ThemedView style={styles.selectorSection}>
        <ThemedText themeColor="textSecondary" style={styles.selectorLabel}>
          Accuracy
        </ThemedText>
        <ThemedView style={styles.segments}>
          {ACCURACY_PRESETS.map((preset) => (
            <Pressable
              key={preset.label}
              onPress={() => setAccuracy(preset)}
              style={[styles.segment, accuracy.label === preset.label && styles.segmentActive]}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  accuracy.label === preset.label && styles.segmentTextActive,
                ]}
              >
                {preset.label}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>

      {/* Distance Filter Selector */}
      <ThemedView style={styles.selectorSection}>
        <ThemedText themeColor="textSecondary" style={styles.selectorLabel}>
          Distance Filter
        </ThemedText>
        <ThemedView style={styles.segments}>
          {DISTANCE_FILTERS.map((filter) => (
            <Pressable
              key={filter.label}
              onPress={() => setDistanceFilter(filter)}
              style={[
                styles.segment,
                distanceFilter.label === filter.label && styles.segmentActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  distanceFilter.label === filter.label && styles.segmentTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>

      {/* Error Display */}
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error.message}</ThemedText>
        </ThemedView>
      )}

      {/* Location Readout */}
      <LocationReadout sample={latest} samplesPerMinute={samplesPerMinute} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  toggleButtonActive: {
    backgroundColor: '#FF3B30',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectorSection: {
    gap: Spacing.one,
  },
  selectorLabel: {
    fontSize: 14,
  },
  segments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  segment: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  segmentActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  segmentText: {
    fontSize: 12,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
});
