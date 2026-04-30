/**
 * Apple Pay Lab — Web variant. Renders IOSOnlyBanner +
 * SetupNotes only.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupNotes from './components/SetupNotes';

export default function ApplePayLabWeb() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <IOSOnlyBanner />
        <SetupNotes />
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
