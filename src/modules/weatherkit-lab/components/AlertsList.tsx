/**
 * AlertsList — WeatherKit Lab (feature 046).
 *
 * Lists active weather alerts. Tapping an alert toggles the
 * expanded summary. Pure presentational + uncontrolled expansion.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { AlertSeverity, WeatherAlert } from '@/native/weatherkit.types';

interface AlertsListProps {
  readonly style?: ViewStyle;
  readonly alerts: readonly WeatherAlert[];
}

export function severityGlyph(s: AlertSeverity): string {
  switch (s) {
    case 'extreme':
      return '🛑';
    case 'severe':
      return '⚠️';
    case 'moderate':
      return '⚠️';
    case 'minor':
      return 'ℹ️';
    case 'unknown':
    default:
      return 'ℹ️';
  }
}

export default function AlertsList({ style, alerts }: AlertsListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = useCallback(
    (id: string) => () => setExpanded((prev) => (prev === id ? null : id)),
    [],
  );

  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="weatherkit-alerts-list"
    >
      <ThemedText type="smallBold">Active alerts</ThemedText>
      {alerts.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="weatherkit-alerts-empty">
          No active alerts for this location.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {alerts.map((a) => {
            const open = expanded === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={toggle(a.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                testID={`weatherkit-alert-${a.id}`}
                style={styles.row}
              >
                <ThemedText type="smallBold">
                  {severityGlyph(a.severity)} {a.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {a.source} · {a.severity}
                </ThemedText>
                {open ? (
                  <ThemedText type="small" testID={`weatherkit-alert-${a.id}-summary`}>
                    {a.summary}
                  </ThemedText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
});
