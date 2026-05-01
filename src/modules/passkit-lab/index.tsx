/**
 * PassKit Lab module — manifest.
 * Feature: 036-passkit-wallet
 *
 * @see specs/036-passkit-wallet/contracts/passkit-lab-manifest.md
 */

import type { ModuleManifest } from '@/modules/types';
import Screen from './screen';

export const MANIFEST_ID = 'passkit-lab' as const;
export const MANIFEST_TITLE = 'Wallet (PassKit)' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '6.0' as const;

export const manifest: ModuleManifest = {
  id: MANIFEST_ID,
  title: MANIFEST_TITLE,
  description: 'Add passes to Apple Wallet via PKAddPassesViewController and PKPassLibrary',
  icon: {
    ios: 'wallet.pass',
    fallback: '🎫',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: MANIFEST_MIN_IOS,
  render: () => <Screen />,
};

export default manifest;
