/**
 * CurrentWeatherCard — WeatherKit Lab (feature 046).
 *
 * Renders the headline metrics: temperature, condition label, SF
 * symbol icon, humidity, wind. Pure presentational; null payload
 * renders an empty placeholder.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CurrentWeather, UnitSystem } from '@/native/weatherkit.types';

import { symbolFor } from '../weather-symbols';

interface CurrentWeatherCardProps {
  readonly style?: ViewStyle;
  readonly current: CurrentWeather | null;
  readonly units: UnitSystem;
}

export function formatTemperature(value: number, units: UnitSystem): string {
  switch (units) {
    case 'imperial':
      return `${Math.round(value)}°F`;
    case 'scientific':
      return `${value.toFixed(1)} K`;
    case 'metric':
    default:
      return `${Math.round(value)}°C`;
  }
}

export function formatWindSpeed(value: number, units: UnitSystem): string {
  if (units === 'imperial') return `${value.toFixed(1)} mph`;
  return `${value.toFixed(1)} km/h`;
}

export default function CurrentWeatherCard({ style, current, units }: CurrentWeatherCardProps) {
  if (!current) {
    return (
      <ThemedView
        style={[styles.container, style]}
        type="backgroundElement"
        testID="weatherkit-current-card-empty"
      >
        <ThemedText type="small" themeColor="textSecondary">
          No data yet — pull to refresh.
        </ThemedText>
      </ThemedView>
    );
  }

  const symbol = symbolFor(current.condition);

  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="weatherkit-current-card"
    >
      <View style={styles.headerRow}>
        <ThemedText style={styles.tempText} testID="weatherkit-current-temperature">
          {formatTemperature(current.temperature, units)}
        </ThemedText>
        <ThemedText style={styles.glyph} testID="weatherkit-current-symbol">
          {symbol.emoji}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" testID="weatherkit-current-condition">
        {symbol.label} ({current.condition})
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Feels like {formatTemperature(current.apparentTemperature, units)}
      </ThemedText>
      <View style={styles.metricsRow}>
        <ThemedText type="small" testID="weatherkit-current-humidity">
          Humidity {Math.round(current.humidity * 100)}%
        </ThemedText>
        <ThemedText type="small" testID="weatherkit-current-wind">
          Wind {formatWindSpeed(current.windSpeed, units)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tempText: {
    fontSize: 48,
    fontWeight: '600',
  },
  glyph: {
    fontSize: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});
