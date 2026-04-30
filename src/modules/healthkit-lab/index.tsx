/**
 * HealthKit Lab Module Manifest
 * Feature: 043-healthkit
 *
 * iOS-focused educational module for Apple HealthKit. Wraps the
 * `react-native-health` community package (no first-party expo-health
 * exists today) and demonstrates auth requests, sample queries, sample
 * writes, and live HKObserverQuery updates.
 *
 * The Screen import is deferred inside `render()` so that simply
 * importing the registry does not transitively load
 * `react-native-health` — the native module is unavailable in the
 * jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const healthkitLab: ModuleManifest = {
  id: 'healthkit-lab',
  title: 'HealthKit Lab',
  description:
    'Educational lab for Apple HealthKit. Demonstrates per-type authorization, querying step count / heart rate / sleep / workouts / weight, writing manual heart-rate and weight samples, and observing live HKObserverQuery updates.',
  icon: {
    ios: 'heart.fill',
    fallback: '❤️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '9.0',
  render: () => require('./screen').default,
};

export default healthkitLab;
