/**
 * LimitedAccessBanner — Shown on iOS 18+ when accessPrivileges === 'limited'.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface LimitedAccessBannerProps {
  onManage: () => void;
}

export function LimitedAccessBanner({ onManage }: LimitedAccessBannerProps) {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="contacts-limited-banner">
      <ThemedText type="small" themeColor="tintB">
        ℹ️ Limited Access (iOS 18+)
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        You can only access selected contacts. Tap below to add or remove contacts from the
        accessible subset.
      </ThemedText>
      <Pressable style={styles.button} onPress={onManage} testID="contacts-manage-limited-button">
        <ThemedText type="small" themeColor="tintA">
          Manage selected contacts
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
    marginBottom: Spacing.three,
  },
  button: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    alignSelf: 'flex-start',
  },
});
