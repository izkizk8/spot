/**
 * StoreKit Lab — Web variant. Renders IOSOnlyBanner +
 * SetupInstructions only.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupInstructions from './components/SetupInstructions';

export default function StoreKitLabWeb() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <IOSOnlyBanner />
        <SetupInstructions />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
