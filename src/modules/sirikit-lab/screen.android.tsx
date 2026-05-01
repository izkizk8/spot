/**
 * SiriKit Lab — Android screen (feature 071).
 *
 * Android gate: shows IOSOnlyBanner.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';

import IOSOnlyBanner from './components/IOSOnlyBanner';

export default function SiriKitLabScreen() {
  return (
    <ThemedView style={styles.container}>
      <IOSOnlyBanner />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
