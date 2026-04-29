# Contract — Bluetooth Lab manifest

**Feature**: 035-core-bluetooth
**See**: [spec.md](../spec.md) FR-001, FR-002, FR-020
**See**: `src/modules/types.ts` (project-wide `ModuleManifest` shape)

Implementation file:

- `src/modules/bluetooth-lab/index.tsx`

## Invariants (asserted by `manifest.test.ts`)

- **M1**. `id === 'bluetooth-lab'` (kebab-case, unique per
  `src/modules/registry.ts` invariants).
- **M2**. `title === 'Bluetooth (BLE Central)'`.
- **M3**. `platforms` is `['ios','android','web']` (all three —
  FR-001).
- **M4**. `minIOS === '7.0'` (FR-001 — Core Bluetooth's central
  role has been stable since iOS 7; the
  `NSBluetoothAlwaysUsageDescription` requirement is iOS 13+ but
  is enforced at runtime by the bridge, not by the manifest).
- **M5**. `render` is a pure function — no side effects at module
  load time; the bridge file is imported only by the screen, never
  by the manifest module. Mirrors 030 / 031 / 032 / 033 / 034 M5.
- **M6**. Adding this entry grows `MODULES.length` by exactly 1
  (SC-007). No other registry entries are modified.
- **M7**. The `description` field is a single-line summary
  ≤ 120 chars suitable for the registry card; the icon's `ios`
  field is an SF Symbol name (suggested: `'antenna.radiowaves.left.and.right'`)
  and the `fallback` field is a non-empty short string.

## Suggested manifest content

```ts
import type { ModuleManifest } from '@/modules/types';
import Screen from './screen';

export const manifest: ModuleManifest = {
  id: 'bluetooth-lab',
  title: 'Bluetooth (BLE Central)',
  description:
    'Central manager state, scanning, connection, GATT discovery, and read / write / subscribe',
  icon: {
    ios: 'antenna.radiowaves.left.and.right',
    fallback: '◉',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '7.0',
  render: () => <Screen />,
};

export default manifest;
```

## Frozen literals (test-friendly constants)

```ts
export const MANIFEST_ID = 'bluetooth-lab' as const;
export const MANIFEST_TITLE = 'Bluetooth (BLE Central)' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '7.0' as const;
```
