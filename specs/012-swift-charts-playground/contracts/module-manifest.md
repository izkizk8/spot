# Contract: Module Manifest

The `swift-charts-lab` module's `index.tsx` MUST export a default
that satisfies `ModuleManifest` from `@/modules/types`.

## Concrete shape

```ts
import React from 'react';
import type { ModuleManifest } from '@/modules/types';
import SwiftChartsLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'swift-charts-lab',
  title: 'Swift Charts Lab',
  description: 'Real Apple Charts on iOS 16+ with a React Native fallback',
  icon: {
    ios: 'chart.xyaxis.line', // or any SF Symbol available on iOS 16+
    fallback: '📊',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0', // Swift Charts is iOS 16+ only
  render: () => <SwiftChartsLabScreen />,
};

export default manifest;
```

## Invariants enforced by tests

`test/unit/modules/swift-charts-lab/manifest.test.ts` MUST assert:

| Invariant | Assertion |
|---|---|
| `id` matches `/^[a-z][a-z0-9-]*$/` | `expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/)` |
| `id === 'swift-charts-lab'` | exact match |
| `platforms` includes all three: ios, android, web | `expect(manifest.platforms).toEqual(expect.arrayContaining(['ios','android','web']))` |
| `minIOS === '16.0'` | exact match (FR-001) |
| `title` is non-empty | length > 0 |
| `description` is non-empty | length > 0 |
| `icon.ios` is non-empty | length > 0 |
| `icon.fallback` is non-empty | length > 0 |
| `render` is a function | `typeof manifest.render === 'function'` |
| **Registry includes this manifest** | `expect(MODULES).toContain(manifest)` from `import { MODULES } from '@/modules/registry'` |

## Registry edit (the only allowed file edit outside the module dir)

`src/modules/registry.ts` gains exactly two changes (one import
line + one array entry — the canonical "1-line edit" referenced in
the planning brief is a single import line; the array entry is the
unavoidable second touch documented by feature 006's manifest
contract):

1. One added import line, appended after `sensorsPlayground`:

   ```ts
   import swiftChartsLab from './swift-charts-lab';
   ```

2. One added entry in the `MODULES` array, appended after
   `sensorsPlayground`:

   ```ts
   export const MODULES: readonly ModuleManifest[] = [
     liquidGlassPlayground,
     liveActivityDemo,
     hapticsPlayground,
     sfSymbolsLab,
     swiftuiInterop,
     sensorsPlayground,
     swiftChartsLab,                  // ← added
   ];
   ```

No other edit to `registry.ts` is permitted (SC-010).
