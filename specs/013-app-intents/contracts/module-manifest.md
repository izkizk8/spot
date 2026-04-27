# Contract: Module Manifest

The `app-intents-lab` module's `index.tsx` MUST export a default
that satisfies `ModuleManifest` from `@/modules/types`.

## Concrete shape

```ts
import React from 'react';
import type { ModuleManifest } from '@/modules/types';
import AppIntentsLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'app-intents-lab',
  title: 'App Intents Lab',
  description: 'Demo of Apple App Intents on iOS 16+; JS-only mood logger fallback.',
  icon: {
    ios: 'square.and.arrow.up.on.square', // or any SF Symbol available on iOS 16+
    fallback: '🎙️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0', // App Intents is iOS 16+ only
  render: () => <AppIntentsLabScreen />,
};

export default manifest;
```

## Invariants enforced by tests

`test/unit/modules/app-intents-lab/manifest.test.ts` MUST assert:

| Invariant | Assertion |
|---|---|
| `id` matches `/^[a-z][a-z0-9-]*$/` | `expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/)` |
| `id === 'app-intents-lab'` | exact match |
| `platforms` includes all three: ios, android, web | `expect(manifest.platforms).toEqual(expect.arrayContaining(['ios','android','web']))` |
| `minIOS === '16.0'` | exact match (FR-001) |
| `title` is non-empty | length > 0 |
| `description` is non-empty | length > 0 |
| `icon.ios` is non-empty | length > 0 |
| `icon.fallback` is non-empty | length > 0 |
| `render` is a function | `typeof manifest.render === 'function'` |
| **Registry includes this manifest** | `expect(MODULES).toContain(manifest)` from `import { MODULES } from '@/modules/registry'` |

## Registry edit (the only allowed file edit outside the module dirs)

`src/modules/registry.ts` gains exactly two changes (one import
line + one array entry — the canonical "1-line edit" referenced
in the planning brief is a single import line; the array entry is
the unavoidable second touch documented by feature 006's manifest
contract):

1. One added import line, appended after `swiftChartsLab`:

   ```ts
   import appIntentsLab from './app-intents-lab';
   ```

2. One added entry in the `MODULES` array, appended after
   `swiftChartsLab`:

   ```ts
   export const MODULES: readonly ModuleManifest[] = [
     liquidGlassPlayground,
     liveActivityDemo,
     hapticsPlayground,
     sfSymbolsLab,
     swiftuiInterop,
     sensorsPlayground,
     swiftChartsLab,
     appIntentsLab,                  // ← added
   ];
   ```

No other edit to `registry.ts` is permitted (SC-010, FR-039).
