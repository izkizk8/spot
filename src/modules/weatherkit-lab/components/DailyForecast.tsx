/**
 * DailyForecast — WeatherKit Lab (feature 046).
 *
 * 10-day list with hi/lo and condition icon. Presentational.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DailyForecastEntry, UnitSystem } from '@/native/weatherkit.types';

import { symbolFor } from '../weather-symbols';
import { formatTemperature } from './CurrentWeatherCard';

interface DailyForecastProps {
  readonly style?: ViewStyle;
  readonly daily: readonly DailyForecastEntry[];
  readonly units: UnitSystem;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getUTCDay()] ?? iso;
}

export default function DailyForecast({ style, daily, units }: DailyForecastProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="weatherkit-daily-forecast"
    >
      <ThemedText type="smallBold">Next 10 days</ThemedText>
      {daily.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="weatherkit-daily-empty">
          No daily data.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {daily.slice(0, 10).map((d, idx) => {
            const symbol = symbolFor(d.condition);
            return (
              <View key={`${d.date}-${idx}`} style={styles.row} testID={`weatherkit-daily-${idx}`}>
                <ThemedText type="small" style={styles.dayLabel}>
                  {formatDay(d.date)}
                </ThemedText>
                <ThemedText style={styles.glyph}>{symbol.emoji}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.lo}>
                  {formatTemperature(d.lowTemperature, units)}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.hi}>
                  {formatTemperature(d.highTemperature, units)}
                </ThemedText>
              </View>
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
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dayLabel: {
    width: 48,
  },
  glyph: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  lo: {
    width: 56,
    textAlign: 'right',
  },
  hi: {
    width: 56,
    textAlign: 'right',
  },
});
