/**
 * HourlyForecast — WeatherKit Lab (feature 046).
 *
 * Horizontal scroll of the next 24 hourly entries. Presentational.
 */

import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { HourlyForecastEntry, UnitSystem } from '@/native/weatherkit.types';

import { symbolFor } from '../weather-symbols';
import { formatTemperature } from './CurrentWeatherCard';

interface HourlyForecastProps {
  readonly style?: ViewStyle;
  readonly hourly: readonly HourlyForecastEntry[];
  readonly units: UnitSystem;
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCHours().toString().padStart(2, '0')}:00`;
}

export default function HourlyForecast({ style, hourly, units }: HourlyForecastProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='weatherkit-hourly-forecast'
    >
      <ThemedText type='smallBold'>Next 24 hours</ThemedText>
      {hourly.length === 0 ? (
        <ThemedText type='small' themeColor='textSecondary' testID='weatherkit-hourly-empty'>
          No hourly data.
        </ThemedText>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          testID='weatherkit-hourly-scroll'
        >
          <View style={styles.row}>
            {hourly.slice(0, 24).map((h, idx) => {
              const symbol = symbolFor(h.condition);
              return (
                <View
                  key={`${h.date}-${idx}`}
                  style={styles.cell}
                  testID={`weatherkit-hourly-${idx}`}
                >
                  <ThemedText type='small'>{formatHour(h.date)}</ThemedText>
                  <ThemedText style={styles.glyph}>{symbol.emoji}</ThemedText>
                  <ThemedText type='smallBold'>
                    {formatTemperature(h.temperature, units)}
                  </ThemedText>
                  {h.precipitationChance > 0 ? (
                    <ThemedText type='small' themeColor='textSecondary'>
                      {Math.round(h.precipitationChance * 100)}%
                    </ThemedText>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cell: {
    alignItems: 'center',
    minWidth: 56,
    gap: Spacing.one,
  },
  glyph: {
    fontSize: 24,
  },
});
