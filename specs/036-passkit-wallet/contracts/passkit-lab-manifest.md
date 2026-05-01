# Contract — `passkit-lab` registry manifest

**Feature**: 036-passkit-wallet
**See**: [spec.md](../spec.md) FR-001, FR-002, FR-003, FR-031
**See**: [plan.md](../plan.md) §"Project Structure"

Implementation files:

- `src/modules/passkit-lab/index.tsx` — exports the
  `ModuleManifest` for this module
- `src/modules/registry.ts` — appends the manifest to the
  modules array

## Invariants (asserted by `test/unit/modules/passkit-lab/manifest.test.ts`)

- **M1**. The manifest is shaped like every other 0xx module
  manifest in `src/modules/registry.ts` (consumes the
  `ModuleManifest` type from `./types`).
- **M2**. `id === 'passkit-lab'` (kebab-case; matches the
  directory name).
- **M3**. `label === 'Wallet (PassKit)'`.
- **M4**. `platforms === ['ios', 'android', 'web']` exactly. The
  module is registered for every platform so the educational shell
  (with the iOS-only banner on Android / Web) is reachable
  everywhere.
- **M5**. `minIOS === '6.0'`. PassKit shipped in iOS 6; the
  capability probes are valid back to iOS 6 and the `openPass` gate
  is enforced separately at the bridge layer (B5 in
  `passkit-bridge.md`).
- **M6**. The manifest's `screen` property resolves at runtime to
  the platform-correct screen file via the `.tsx` /
  `.android.tsx` / `.web.tsx` resolver convention. The manifest
  does NOT inline `Platform.select`; it imports the canonical
  `./screen` and the bundler picks the right variant.
- **M7**. After 036 lands, `src/modules/registry.ts` exports an
  array of length **31** (30 prior modules + `passkitLab`). The
  registry test asserts the length explicitly.

## Manifest shape

```ts
// src/modules/passkit-lab/index.tsx
import type { ModuleManifest } from '../types';
import PassKitLabScreen from './screen';

const passkitLab: ModuleManifest = {
  id: 'passkit-lab',
  label: 'Wallet (PassKit)',
  platforms: ['ios', 'android', 'web'],
  minIOS: '6.0',
  screen: PassKitLabScreen,
};

export default passkitLab;
```

## Registry edit

```ts
// src/modules/registry.ts (additive — exactly 2 lines)

// Add new modules here ↓ One import line per module.
// ...
import passkitLab from './passkit-lab';   // +1 import line

export const modules: ModuleManifest[] = [
  // ...30 prior entries...
  passkitLab,                              // +1 array entry (last)
];
```

## Test surface (sketch)

`test/unit/modules/passkit-lab/manifest.test.ts` exercises:

- The default-exported manifest matches each invariant M2–M6
  literally.
- The manifest's `screen` is a renderable React component (a smoke
  render with RNTL, no assertions on content).
- (Optional, often co-located in the registry test) the registry
  contains 31 modules and the last entry is `passkit-lab`.
