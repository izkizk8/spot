# Contract — `eventkit-lab` registry manifest

**Feature**: 037-eventkit
**See**: [spec.md](../spec.md) FR-001, FR-002, FR-003
**See**: [plan.md](../plan.md) §"Project Structure"

Implementation files:

- `src/modules/eventkit-lab/index.tsx` — exports the
  `ModuleManifest` for this module
- `src/modules/registry.ts` — appends the manifest to the modules
  array

## Invariants (asserted by `test/unit/modules/eventkit-lab/manifest.test.ts`)

- **M1**. The manifest is shaped like every other 0xx module
  manifest in `src/modules/registry.ts` (consumes the
  `ModuleManifest` type from `./types`).
- **M2**. `id === 'eventkit-lab'` (kebab-case; matches the
  directory name).
- **M3**. `label === 'EventKit Lab'`.
- **M4**. `platforms === ['ios', 'android', 'web']` exactly. The
  module is registered for every platform so the educational shell
  (with the iOS-only banner on web and the Reminders notice on
  Android) is reachable everywhere.
- **M5**. `minIOS === '4.0'`. EventKit shipped in iOS 4; the
  authorisation flows are valid back to iOS 4 and the iOS 17+
  branches are gated separately at the hook layer
  (`AuthorizationStatus.writeOnly` /
  `ReminderAuthorizationStatus.fullAccess`).
- **M6**. The manifest's `screen` property resolves at runtime to
  the platform-correct screen file via the `.tsx` /
  `.android.tsx` / `.web.tsx` resolver convention. The manifest
  does NOT inline `Platform.select`; it imports the canonical
  `./screen` and the bundler picks the right variant.
- **M7**. After 037 lands, `src/modules/registry.ts` exports an
  array containing `eventkitLab` immediately after `passkitLab`
  (parent count + 1). The registry test asserts the new tail entry
  by id.

## Manifest shape

```ts
// src/modules/eventkit-lab/index.tsx
import type { ModuleManifest } from '../types';
import EventKitLabScreen from './screen';

const eventkitLab: ModuleManifest = {
  id: 'eventkit-lab',
  label: 'EventKit Lab',
  platforms: ['ios', 'android', 'web'],
  minIOS: '4.0',
  screen: EventKitLabScreen,
};

export default eventkitLab;
```

## Registry edit

```ts
// src/modules/registry.ts (additive — exactly 2 lines)

// ...existing imports above...
import passkitLab from './passkit-lab';
import eventkitLab from './eventkit-lab';     // +1 import line

export const modules: ModuleManifest[] = [
  // ...prior entries...
  passkitLab,
  eventkitLab,                                  // +1 array entry (last)
];
```

## Test surface (sketch)

`test/unit/modules/eventkit-lab/manifest.test.ts` exercises:

- The default-exported manifest matches each invariant M2–M6
  literally.
- The manifest's `screen` is a renderable React component (a smoke
  render with RNTL, no assertions on content).
- (Optional, often co-located in the registry test) the registry
  contains `eventkitLab` immediately after `passkitLab`.
