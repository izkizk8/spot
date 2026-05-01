/**
 * PhotoKit Lab — iOS screen (feature 057).
 *
 * Composes the showcase sections: capability card, picker controls,
 * photo grid, and setup instructions. The native bridge is exercised
 * through the `usePhotoKit` hook.
 */

import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import PhotoGrid from './components/PhotoGrid';
import PhotoPicker from './components/PhotoPicker';
import SetupInstructions from './components/SetupInstructions';
import { usePhotoKit } from './hooks/usePhotoKit';

export default function PhotoKitLabScreen() {
  const {
    authorizationStatus,
    assets,
    loading,
    checkStatus,
    requestAccess,
    pickPhotos,
    clearAssets,
  } = usePhotoKit();

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  if (Platform.OS !== 'ios') {
    return (
      <ThemedView style={styles.container}>
        <IOSOnlyBanner />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilityCard style={styles.card} authorizationStatus={authorizationStatus} />
        <PhotoPicker
          style={styles.card}
          authorizationStatus={authorizationStatus}
          loading={loading}
          onRequestAccess={() => {
            void requestAccess();
          }}
          onPickPhotos={() => {
            void pickPhotos({ selectionLimit: 10 });
          }}
          onClear={clearAssets}
        />
        <PhotoGrid style={styles.card} assets={assets} />
        <SetupInstructions style={styles.card} />
      </ScrollView>
    </ThemedView>
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
    marginBottom: Spacing.two,
  },
});
