/**
 * Live Stickers Lab — Android variant. Renders IOSOnlyBanner only.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';

import IOSOnlyBanner from './components/IOSOnlyBanner';

export default function LiveStickersLabAndroid() {
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
