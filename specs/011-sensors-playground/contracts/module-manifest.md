# Contract: Module Manifest

The `sensors-playground` module's `index.tsx` MUST export a default
that satisfies `ModuleManifest` from `@/modules/types`.

## Concrete shape

```ts
import type { ModuleManifest } from '@/modules/types';
import SensorsPlaygroundScreen from './screen';

const manifest: ModuleManifest = {
  id: 'sensors-playground',
  title: 'Sensors Playground',
  description: 'Live accelerometer, gyroscope, magnetometer, and motion data',
  icon: {
    ios: 'gauge.with.dots.needle.bottom.50percent', // or any SF Symbol available pre-iOS 17
    fallback: '📡',
  },
  platforms: ['ios', 'android', 'web'],
  // No minIOS — expo-sensors supports iOS 13+; per-card runtime gating handles availability
  render: () => <SensorsPlaygroundScreen />,
};

export default manifest;
```

## Invariants enforced by tests

`test/unit/modules/sensors-playground/manifest.test.ts` MUST assert:

| Invariant | Assertion |
|---|---|
| `id` matches `/^[a-z][a-z0-9-]*$/` | `expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/)` |
| `id === 'sensors-playground'` | exact match |
| `platforms` includes all three: ios, android, web | `expect(manifest.platforms).toEqual(expect.arrayContaining(['ios','android','web']))` |
| `minIOS` is **not** set | `expect(manifest.minIOS).toBeUndefined()` |
| `title` is non-empty | length > 0 |
| `description` is non-empty | length > 0 |
| `icon.ios` is non-empty | length > 0 |
| `icon.fallback` is non-empty | length > 0 |
| `render` is a function | `typeof manifest.render === 'function'` |
| **Registry includes this manifest** | `expect(MODULES).toContain(manifest)` from `import { MODULES } from '@/modules/registry'` |

## Registry edit (the only allowed file edit outside the module dir)

`src/modules/registry.ts` gains exactly two changes:

1. One added import line (alphabetised with peers is **not**
   required — current registry orders by author choice; append):

   ```ts
   import sensorsPlayground from './sensors-playground';
   ```

2. One added entry in the `MODULES` array, appended after
   `swiftuiInterop`:

   ```ts
   export const MODULES: readonly ModuleManifest[] = [
     liquidGlassPlayground,
     liveActivityDemo,
     hapticsPlayground,
     sfSymbolsLab,
     swiftuiInterop,
     sensorsPlayground,                  // ← added
   ];
   ```

No other edit to `registry.ts` is permitted (SC-010).
