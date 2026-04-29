/**
 * Bluetooth Lab module — manifest.
 * Feature: 035-core-bluetooth
 *
 * @see specs/035-core-bluetooth/contracts/bluetooth-lab-manifest.md
 */

import type { ModuleManifest } from '@/modules/types';
import Screen from './screen';

export const MANIFEST_ID = 'bluetooth-lab' as const;
export const MANIFEST_TITLE = 'Bluetooth (BLE Central)' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '7.0' as const;

export const manifest: ModuleManifest = {
  id: MANIFEST_ID,
  title: MANIFEST_TITLE,
  description:
    'Central manager state, scanning, connection, GATT discovery, and read / write / subscribe',
  icon: {
    ios: 'antenna.radiowaves.left.and.right',
    fallback: '◉',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: MANIFEST_MIN_IOS,
  render: () => <Screen />,
};

export default manifest;
