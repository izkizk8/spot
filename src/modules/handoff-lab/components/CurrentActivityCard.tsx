/**
 * CurrentActivityCard — feature 040 / T031 / US3.
 *
 * Displays the mirrored ActivityDefinition (or empty state) and a
 * "Resign" button that fires `onResign`.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ActivityDefinition } from '../types';

interface CurrentActivityCardProps {
  readonly currentActivity: ActivityDefinition | null;
  readonly onResign: () => void;
  readonly style?: ViewStyle;
}

interface PillProps {
  readonly label: string;
  readonly active: boolean;
}

function Pill({ label, active }: PillProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: active ? theme.tintA : theme.backgroundElement,
        },
      ]}
    >
      <ThemedText
        type='small'
        themeColor={active ? 'background' : 'textSecondary'}
        style={styles.pillText}
      >
        {label}
      </ThemedText>
    </View>
  );
}

export default function CurrentActivityCard({
  currentActivity,
  onResign,
  style,
}: CurrentActivityCardProps) {
  const theme = useTheme();
  const isPopulated = currentActivity !== null;

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Current Activity</ThemedText>

      {!isPopulated ? (
        <ThemedText type='small' themeColor='textSecondary'>
          No current activity. Compose one above and tap &quot;Become current&quot;.
        </ThemedText>
      ) : (
        <View style={styles.body}>
          <ThemedText type='smallBold'>activityType</ThemedText>
          <ThemedText type='small'>{currentActivity.activityType}</ThemedText>

          <ThemedText type='smallBold'>title</ThemedText>
          <ThemedText type='small'>{currentActivity.title}</ThemedText>

          {currentActivity.webpageURL !== undefined ? (
            <>
              <ThemedText type='smallBold'>webpageURL</ThemedText>
              <ThemedText type='small'>{currentActivity.webpageURL}</ThemedText>
            </>
          ) : null}

          <ThemedText type='smallBold'>userInfo</ThemedText>
          <ThemedText type='small' style={styles.code}>
            {JSON.stringify(currentActivity.userInfo, null, 2)}
          </ThemedText>

          <ThemedText type='smallBold'>requiredUserInfoKeys</ThemedText>
          <ThemedText type='small'>
            {[...currentActivity.requiredUserInfoKeys].toSorted().join(', ') || '(none)'}
          </ThemedText>

          <View style={styles.pillRow}>
            <Pill label='Handoff' active={currentActivity.isEligibleForHandoff} />
            <Pill label='Search' active={currentActivity.isEligibleForSearch} />
            <Pill label='Prediction' active={currentActivity.isEligibleForPrediction} />
          </View>
        </View>
      )}

      <Pressable
        onPress={onResign}
        disabled={!isPopulated}
        testID='resign-btn'
        accessibilityState={{ disabled: !isPopulated }}
        style={[
          styles.btn,
          { backgroundColor: isPopulated ? theme.tintB : theme.backgroundElement },
        ]}
      >
        <ThemedText type='smallBold' themeColor={isPopulated ? 'background' : 'textSecondary'}>
          Resign
        </ThemedText>
      </Pressable>
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
  body: {
    gap: Spacing.one,
  },
  code: {
    fontFamily: 'Courier',
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  pillText: {
    fontSize: 12,
  },
  btn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
