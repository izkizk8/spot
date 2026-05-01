/**
 * PermissionBanner — Audio Lab microphone-permission banner (US1, T033).
 *
 * Renders nothing unless `status === 'denied'`. When denied, shows
 * explanatory copy + a "Request permission" button that invokes
 * `onRequestPermission` (FR-027 / FR-028).
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { PermissionStatus } from '../audio-types';

export interface PermissionBannerProps {
  status: PermissionStatus;
  onRequestPermission: () => void;
}

export default function PermissionBanner({ status, onRequestPermission }: PermissionBannerProps) {
  if (status !== 'denied') return null;

  return (
    <ThemedView
      type='backgroundElement'
      style={styles.container}
      accessibilityRole='alert'
      accessibilityLabel='Microphone permission denied'
      testID='audio-lab-permission-banner'
    >
      <ThemedText type='smallBold'>Microphone access is blocked</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Audio Lab needs microphone access to capture recordings. Re-grant permission to continue.
      </ThemedText>
      <Pressable
        onPress={onRequestPermission}
        accessibilityRole='button'
        accessibilityLabel='Request microphone permission'
        style={styles.button}
      >
        <ThemedText type='smallBold' themeColor='tintA'>
          Request permission
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.one,
    alignSelf: 'flex-start',
  },
});
