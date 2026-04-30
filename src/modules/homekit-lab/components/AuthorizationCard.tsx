/**
 * AuthorizationCard — HomeKit Lab (feature 044).
 *
 * Shows the current `HMHomeManager` access status and a "Request
 * access" button that triggers the hook's `init()`.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { type HomeKitAuthStatus, labelForAuthStatus } from '../characteristic-types';

interface AuthorizationCardProps {
  readonly authStatus: HomeKitAuthStatus;
  readonly initialised: boolean;
  readonly available: boolean | null;
  readonly onRequest: () => void;
  readonly style?: ViewStyle;
}

function statusColor(theme: ReturnType<typeof useTheme>, status: HomeKitAuthStatus): string {
  switch (status) {
    case 'authorized':
      return theme.tintA;
    case 'denied':
    case 'restricted':
      return theme.tintB;
    default:
      return theme.textSecondary;
  }
}

export default function AuthorizationCard({
  authStatus,
  initialised,
  available,
  onRequest,
  style,
}: AuthorizationCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, style]} testID="homekit-auth-card">
      <ThemedText style={styles.heading}>Authorization</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        HomeKit asks the user once per app for read/write access to all homes. Status reflects the
        current `HMHomeManager` authorization state.
      </ThemedText>
      <View style={styles.row} testID="homekit-auth-row">
        <ThemedText type="smallBold">Status</ThemedText>
        <ThemedText
          type="small"
          style={[styles.status, { color: statusColor(theme, authStatus) }]}
          testID="homekit-auth-status"
        >
          {labelForAuthStatus(authStatus)}
        </ThemedText>
      </View>
      <Pressable
        testID="homekit-request-access"
        onPress={onRequest}
        style={[styles.cta, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type="smallBold" themeColor="background">
          {initialised ? 'Re-request access' : 'Request access'}
        </ThemedText>
      </Pressable>
      {available === false ? (
        <ThemedText type="small" themeColor="tintB" testID="homekit-unavailable">
          HomeKit is not available on this device.
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.one,
  },
  status: {
    fontVariant: ['tabular-nums'],
  },
  cta: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
