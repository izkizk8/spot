/**
 * ARKit Lab Screen — iOS variant
 * Feature: 034-arkit-basics
 *
 * Six panels in fixed order: CapabilitiesCard, AR view, ConfigurationCard,
 * tap-to-place controls, AnchorsPanel, StatsBar.
 */

import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import * as arkit from '@/native/arkit';

import CapabilitiesCard from './components/CapabilitiesCard';
import ARViewWrapper from './components/ARViewWrapper';
import ConfigurationCard from './components/ConfigurationCard';
import AnchorsPanel from './components/AnchorsPanel';
import StatsBar from './components/StatsBar';
import { useARKitSession } from './hooks/useARKitSession';

export default function ARKitLabScreen() {
  const session = useARKitSession();
  const isAvailable = arkit.isAvailable();

  // Assume permission granted for iOS variant; in production, check via permission helper
  const permissionGranted = true;

  // Assume peopleOcclusion supported on modern devices; in production, check runtime capability
  const peopleOcclusionSupported = false;

  const handleTap = () => {
    // In production, this would be triggered by native view tap gesture
    // For now, simulate tap at fixed coordinates
    session.placeAnchorAt(100, 200);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Panel 1: CapabilitiesCard */}
        <CapabilitiesCard
          worldTrackingSupported={isAvailable}
          peopleOcclusionSupported={peopleOcclusionSupported}
          info={session.info}
        />

        {/* Panel 2: AR View */}
        <View style={styles.arViewContainer}>
          <ARViewWrapper
            isAvailable={isAvailable}
            permissionGranted={permissionGranted}
            config={session.config}
          />
          {/* Tap placeholder - in production, tap gesture on ARKitView */}
          <TouchableOpacity
            style={styles.tapOverlay}
            onPress={handleTap}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.tapHint}>
              Tap to place anchor (simulated)
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Panel 3: ConfigurationCard */}
        <ConfigurationCard
          config={session.config}
          peopleOcclusionSupported={peopleOcclusionSupported}
          onChange={session.setConfig}
          onReset={session.reset}
        />

        {/* Panel 4: Tap-to-place controls */}
        <ThemedView style={styles.section}>
          <View style={styles.row}>
            <ThemedText style={styles.label}>
              Anchors: {session.anchors.length}
            </ThemedText>
            <TouchableOpacity
              style={styles.button}
              onPress={session.clearAnchors}
            >
              <ThemedText style={styles.buttonText}>Clear all</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Panel 5: AnchorsPanel */}
        <AnchorsPanel anchors={session.anchors} />
      </ScrollView>

      {/* Panel 6: StatsBar (fixed at bottom) */}
      <StatsBar info={session.info} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  arViewContainer: {
    height: 300,
    position: 'relative',
  },
  tapOverlay: {
    position: 'absolute',
    bottom: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    padding: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  tapHint: {
    color: '#fff',
    fontSize: 12,
  },
  section: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
