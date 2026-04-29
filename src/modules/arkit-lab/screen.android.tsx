/**
 * ARKit Lab Screen — Android variant
 * Feature: 034-arkit-basics
 *
 * Same panel structure as iOS, but AR view replaced with IOSOnlyBanner
 * and configuration controls disabled.
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

  // Android: always false
  const permissionGranted = false;
  const peopleOcclusionSupported = false;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Panel 1: CapabilitiesCard */}
        <CapabilitiesCard
          worldTrackingSupported={isAvailable}
          peopleOcclusionSupported={peopleOcclusionSupported}
          info={session.info}
        />

        {/* Panel 2: AR View (IOSOnlyBanner on Android) */}
        <View style={styles.arViewContainer}>
          <ARViewWrapper
            isAvailable={isAvailable}
            permissionGranted={permissionGranted}
            config={session.config}
          />
        </View>

        {/* Panel 3: ConfigurationCard (disabled on Android) */}
        <ConfigurationCard
          config={session.config}
          peopleOcclusionSupported={peopleOcclusionSupported}
          onChange={session.setConfig}
          onReset={session.reset}
        />

        {/* Panel 4: Tap-to-place controls (disabled on Android) */}
        <ThemedView style={styles.section}>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Anchors: {session.anchors.length}</ThemedText>
            <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled>
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
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
