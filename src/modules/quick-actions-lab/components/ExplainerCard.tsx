/**
 * ExplainerCard — surfaces the iOS 4-action cap rule.
 * Feature: 039-quick-actions
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function ExplainerCard() {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='explainer-card'>
      <ThemedText type='subtitle'>How Quick Actions work</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        iOS shows up to 4 rows when you long-press an app icon. Spot ships 4 static defaults via
        Info.plist and lets you mix in dynamic items at runtime — total stays capped at 4.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
});
