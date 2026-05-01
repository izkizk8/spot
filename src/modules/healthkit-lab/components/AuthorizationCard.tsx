/**
 * AuthorizationCard — HealthKit Lab (feature 043).
 *
 * Shows the per-sample-type auth status (undetermined / authorized /
 * denied) and a "Request access" button that triggers the hook's init
 * (which calls HKHealthStore initHealthKit).
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { type AuthStatus, type HealthSampleId, SAMPLE_IDS, labelForSample } from '../sample-types';

interface AuthorizationCardProps {
  readonly authStatusByType: Readonly<Record<HealthSampleId, AuthStatus>>;
  readonly initialised: boolean;
  readonly available: boolean | null;
  readonly onRequest: () => void;
  readonly style?: ViewStyle;
}

const STATUS_LABEL: Readonly<Record<AuthStatus, string>> = Object.freeze({
  undetermined: 'Not determined',
  authorized: 'Authorized',
  denied: 'Denied',
});

function statusColor(theme: ReturnType<typeof useTheme>, status: AuthStatus): string {
  switch (status) {
    case 'authorized':
      return theme.tintA;
    case 'denied':
      return theme.tintB;
    default:
      return theme.textSecondary;
  }
}

export default function AuthorizationCard({
  authStatusByType,
  initialised,
  available,
  onRequest,
  style,
}: AuthorizationCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, style]} testID='healthkit-auth-card'>
      <ThemedText style={styles.heading}>Authorization</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        HealthKit asks for permission once per sample type. Apple does not expose read-permission
        status programmatically below iOS 12, so &quot;Not determined&quot; is the safe baseline.
      </ThemedText>
      <View style={styles.rows}>
        {SAMPLE_IDS.map((id) => {
          const status = authStatusByType[id];
          return (
            <View key={id} style={styles.row} testID={`healthkit-auth-row-${id}`}>
              <ThemedText type='smallBold'>{labelForSample(id)}</ThemedText>
              <ThemedText
                type='small'
                style={[styles.status, { color: statusColor(theme, status) }]}
              >
                {STATUS_LABEL[status]}
              </ThemedText>
            </View>
          );
        })}
      </View>
      <Pressable
        testID='healthkit-request-access'
        onPress={onRequest}
        style={[styles.cta, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type='smallBold' themeColor='background'>
          {initialised ? 'Re-request access' : 'Request access'}
        </ThemedText>
      </Pressable>
      {available === false ? (
        <ThemedText type='small' themeColor='tintB' testID='healthkit-unavailable'>
          HealthKit is not available on this device.
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
  rows: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
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
