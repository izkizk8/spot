/**
 * @file PermissionNotice.tsx
 * @description Inline notice for unsupported sensor / denied permission.
 */
import React from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type PermissionNoticeKind = 'idle' | 'unsupported' | 'denied';

export interface PermissionNoticeProps {
  kind: PermissionNoticeKind;
}

export function PermissionNotice({ kind }: PermissionNoticeProps) {
  if (kind === 'idle') return null;

  if (kind === 'unsupported') {
    return (
      <ThemedView style={styles.box} testID="permission-notice-unsupported">
        <ThemedText type="small">Not supported on this platform</ThemedText>
      </ThemedView>
    );
  }

  // denied
  return (
    <ThemedView style={styles.box} testID="permission-notice-denied">
      <ThemedText type="small">Permission denied</ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Linking.openSettings();
        }}
        style={styles.button}
        testID="permission-open-settings"
      >
        <ThemedText type="smallBold">Open Settings</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    gap: Spacing.one,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    alignSelf: 'flex-start',
  },
});
