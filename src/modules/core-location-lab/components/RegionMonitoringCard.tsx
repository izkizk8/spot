/**
 * RegionMonitoringCard component (feature 025).
 *
 * Manages geofenced regions with add/remove controls and an events log.
 * iOS only - Android/web screens swap this for IOSOnlyBanner.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { useRegionMonitoring } from '../hooks/useRegionMonitoring';
import type { RegionRadiusMeters } from '../types';

import { EventLog } from './EventLog';
import { RegionRow } from './RegionRow';

const RADIUS_OPTIONS: RegionRadiusMeters[] = [50, 100, 500];

export interface RegionMonitoringCardProps {
  currentLocation: { latitude: number; longitude: number } | null;
}

export function RegionMonitoringCard({ currentLocation }: RegionMonitoringCardProps) {
  const { regions, events, addRegion, error } = useRegionMonitoring();
  const [selectedRadius, setSelectedRadius] = useState<RegionRadiusMeters>(100);

  const handleAddRegion = () => {
    if (!currentLocation) return;

    void addRegion({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radius: selectedRadius,
    });
  };

  const hasLocation = currentLocation !== null;

  return (
    <ThemedView type='backgroundElement' style={styles.card}>
      <ThemedText type='subtitle' style={styles.title}>
        Region Monitoring
      </ThemedText>

      {/* Radius Selector */}
      <ThemedView style={styles.selectorSection}>
        <ThemedText themeColor='textSecondary' style={styles.selectorLabel}>
          Radius
        </ThemedText>
        <ThemedView style={styles.segments}>
          {RADIUS_OPTIONS.map((radius) => (
            <Pressable
              key={radius}
              onPress={() => setSelectedRadius(radius)}
              style={[styles.segment, selectedRadius === radius && styles.segmentActive]}
            >
              <ThemedText
                style={[styles.segmentText, selectedRadius === radius && styles.segmentTextActive]}
              >
                {radius} m
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>

      {/* Add Button */}
      <Pressable
        onPress={hasLocation ? handleAddRegion : undefined}
        style={[styles.addButton, !hasLocation && styles.addButtonDisabled]}
        disabled={!hasLocation}
      >
        <ThemedText style={styles.addButtonText}>Add at current location</ThemedText>
      </Pressable>

      {!hasLocation && (
        <ThemedText themeColor='textSecondary' style={styles.note}>
          Waiting for a location fix...
        </ThemedText>
      )}

      {/* Error Display */}
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error.message}</ThemedText>
        </ThemedView>
      )}

      {/* Regions List */}
      {regions.length > 0 && (
        <ThemedView style={styles.regionsList}>
          <ThemedText themeColor='textSecondary' style={styles.sectionLabel}>
            Monitored Regions ({regions.length})
          </ThemedText>
          {regions.map((region) => (
            <RegionRow key={region.id} region={region} />
          ))}
        </ThemedView>
      )}

      {/* Events Log */}
      <ThemedView style={styles.eventsSection}>
        <ThemedText themeColor='textSecondary' style={styles.sectionLabel}>
          Events
        </ThemedText>
        <EventLog entries={events} type='region' />
      </ThemedView>
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
  selectorSection: {
    gap: Spacing.one,
  },
  selectorLabel: {
    fontSize: 14,
  },
  segments: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  segment: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  segmentActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  segmentText: {
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
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
  regionsList: {
    gap: Spacing.one,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventsSection: {
    gap: Spacing.two,
  },
});
