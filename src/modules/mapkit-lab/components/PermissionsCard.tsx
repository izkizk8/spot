import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PermissionStatus = 'undetermined' | 'denied' | 'granted' | 'restricted';

interface PermissionsCardProps {
  status: PermissionStatus;
  onRequest: () => Promise<void>;
}

export function PermissionsCard({ status, onRequest }: PermissionsCardProps) {
  const theme = useTheme();
  const canRequest = status === 'undetermined';

  const handlePress = async () => {
    await onRequest();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.statusRow} testID="permissions-status-row">
        <ThemedText type="smallBold">Permission status</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" testID="permissions-status-value">
          {status}
        </ThemedText>
      </ThemedView>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canRequest }}
        disabled={!canRequest}
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: canRequest ? theme.tintA : theme.backgroundElement,
            opacity: canRequest ? 1 : 0.5,
          },
        ]}
      >
        <ThemedText
          type="smallBold"
          style={{ color: canRequest ? '#ffffff' : theme.textSecondary }}
        >
          Request when-in-use permission
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
    borderRadius: Spacing.two,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
