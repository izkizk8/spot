/**
 * App Clips Lab — Web variant. Renders IOSOnlyBanner only.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import IOSOnlyBanner from './components/IOSOnlyBanner';

export default function AppClipsLabWeb() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <IOSOnlyBanner />
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
  },
});
