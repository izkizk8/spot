/**
 * LiveObserveCard — HomeKit Lab (feature 044).
 *
 * Subscribes to characteristic update notifications and displays a
 * running count of received updates. Toggling tears the observer
 * down and resets the indicator (the counter persists so users can
 * see how many events arrived during the session).
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface LiveObserveCardProps {
  readonly observerActive: boolean;
  readonly observerUpdateCount: number;
  readonly canSubscribe: boolean;
  readonly onToggle: () => void;
  readonly style?: ViewStyle;
}

export default function LiveObserveCard({
  observerActive,
  observerUpdateCount,
  canSubscribe,
  onToggle,
  style,
}: LiveObserveCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, style]} testID="homekit-live-card">
      <ThemedText style={styles.heading}>Live observe demo</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Subscribe to the selected characteristic and watch updates arrive in real time.
      </ThemedText>
      <View style={styles.row}>
        <ThemedText type="smallBold">Updates received</ThemedText>
        <ThemedText
          type="small"
          themeColor="text"
          style={styles.counter}
          testID="homekit-live-count"
        >
          {observerUpdateCount}
        </ThemedText>
      </View>
      <Pressable
        testID="homekit-live-toggle"
        onPress={onToggle}
        disabled={!canSubscribe}
        style={[
          styles.cta,
          {
            backgroundColor: observerActive ? theme.tintB : theme.tintA,
            opacity: canSubscribe ? 1 : 0.5,
          },
        ]}
      >
        <ThemedText type="smallBold" themeColor="background">
          {observerActive ? 'Unsubscribe' : 'Subscribe'}
        </ThemedText>
      </Pressable>
      {!canSubscribe ? (
        <ThemedText type="small" themeColor="textSecondary" testID="homekit-live-disabled-reason">
          Select a characteristic above to enable the observer.
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
  },
  counter: {
    fontVariant: ['tabular-nums'],
  },
  cta: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
});
