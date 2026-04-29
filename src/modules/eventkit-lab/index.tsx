/**
 * EventKit Lab module — manifest.
 * Feature: 037-eventkit
 */

import type { ModuleManifest } from '@/modules/types';

import Screen from './screen';

export const MANIFEST_ID = 'eventkit-lab' as const;
export const MANIFEST_TITLE = 'EventKit Lab' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '4.0' as const;

export const manifest: ModuleManifest = {
  id: MANIFEST_ID,
  title: MANIFEST_TITLE,
  description: 'Calendar and Reminders via EventKit and expo-calendar',
  icon: {
    ios: 'calendar',
    fallback: '📅',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: MANIFEST_MIN_IOS,
  render: () => <Screen />,
};

export default manifest;
