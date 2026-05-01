/**
 * AndroidRemindersNotice — Alert banner shown on Android explaining that the
 * Reminders surface has limited or no platform support.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function AndroidRemindersNotice() {
  return (
    <ThemedView
      style={styles.container}
      type='backgroundElement'
      accessibilityRole='alert'
      testID='eventkit-android-reminders-notice'
    >
      <ThemedText type='small' themeColor='textSecondary' style={styles.text}>
        Reminders are limited or unavailable on Android
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  text: {
    lineHeight: 20,
  },
});
