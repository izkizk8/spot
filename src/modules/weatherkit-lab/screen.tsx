/**
 * WeatherKit Lab — iOS screen (feature 046).
 *
 * Composes the seven sections: LocationPicker, UnitPicker,
 * CurrentWeatherCard, HourlyForecast, DailyForecast, AlertsList,
 * AttributionFooter. The native bridge is exercised through the
 * `useWeather` hook; an explicit "Refresh" button kicks off the
 * fetch (no auto-load on mount so the screen renders cleanly when
 * the entitlement is missing).
 */

import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AlertsList from './components/AlertsList';
import AttributionFooter from './components/AttributionFooter';
import CurrentWeatherCard from './components/CurrentWeatherCard';
import DailyForecast from './components/DailyForecast';
import HourlyForecast from './components/HourlyForecast';
import LocationPicker from './components/LocationPicker';
import UnitPicker from './components/UnitPicker';
import { useWeather } from './hooks/useWeather';

export default function WeatherKitLabScreen() {
  const w = useWeather();
  const onRefresh = useCallback(() => {
    void w.refresh();
  }, [w]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <LocationPicker style={styles.card} selectedCityId={w.cityId} onSelect={w.selectCity} />
        <UnitPicker style={styles.card} selected={w.units} onSelect={w.selectUnits} />
        <Pressable
          accessibilityRole="button"
          onPress={onRefresh}
          testID="weatherkit-refresh"
          style={styles.refreshButton}
        >
          <ThemedText type="link">{w.loading ? 'Refreshing…' : 'Refresh forecast'}</ThemedText>
        </Pressable>
        {w.lastError ? (
          <ThemedText type="small" themeColor="tintB" testID="weatherkit-error">
            {w.lastError}
          </ThemedText>
        ) : null}
        <CurrentWeatherCard style={styles.card} current={w.current} units={w.units} />
        <HourlyForecast style={styles.card} hourly={w.hourly} units={w.units} />
        <DailyForecast style={styles.card} daily={w.daily} units={w.units} />
        <AlertsList style={styles.card} alerts={w.alerts} />
        <AttributionFooter style={styles.card} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.two,
  },
  refreshButton: {
    paddingVertical: Spacing.one,
    alignItems: 'center',
  },
});
