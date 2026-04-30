/**
 * WeatherKit Lab Module Manifest
 * Feature: 046-weatherkit
 *
 * iOS 16+ educational module for Apple WeatherKit. Wraps a custom
 * thin Swift bridge (`WeatherKitBridge.swift`) over
 * `WeatherService.shared`. Demonstrates current weather, hourly
 * forecast, daily forecast, weather alerts, attribution and unit
 * selection.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const weatherkitLab: ModuleManifest = {
  id: 'weatherkit-lab',
  title: 'WeatherKit Lab',
  description:
    'Educational lab for Apple WeatherKit (iOS 16+). Picks a preset city or current location; renders current weather, hourly forecast, daily forecast and active weather alerts; switches between Metric / Imperial / Scientific units. Requires the com.apple.developer.weatherkit entitlement.',
  icon: {
    ios: 'cloud.sun.fill',
    fallback: '⛅',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => require('./screen').default,
};

export default weatherkitLab;
