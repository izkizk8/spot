# Contract: Module Manifest

The `swiftui-interop` module exports a default `ModuleManifest` from
`src/modules/swiftui-interop/index.tsx` that satisfies the project-wide
contract in `src/modules/types.ts`. This document captures the
concrete values and the invariants tests will assert.

## Required exports

```ts
// src/modules/swiftui-interop/index.tsx
import type { ModuleManifest } from '@/modules/types';
import { SwiftUIInteropScreen } from './screen';

const manifest: ModuleManifest = {
  id: 'swiftui-interop',
  title: 'SwiftUI Interop',
  description:
    'Real SwiftUI Picker, ColorPicker, DatePicker, Slider, Stepper & Toggle bridged to React Native.',
  icon: { ios: 'swift', fallback: '🟦' }, // ios symbol confirmed via Expo-UI-SwiftUI / SF Symbols at implement time
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <SwiftUIInteropScreen />,
};

export default manifest;
```

## Registry edit

Exactly one import line and one array entry added to
`src/modules/registry.ts`:

```ts
import swiftuiInterop from './swiftui-interop';
// ...
export const MODULES: readonly ModuleManifest[] = [
  liquidGlassPlayground,
  liveActivityDemo,
  hapticsPlayground,
  sfSymbolsLab,
  swiftuiInterop,        // ← added
];
```

No other file outside `src/modules/swiftui-interop/` is modified
(SC-006). `package.json` / `pnpm-lock.yaml` updates to add `@expo/ui`
are infrastructure and out of scope for SC-006.

## Test invariants

Asserted by `test/unit/modules/swiftui-interop/manifest.test.ts`
(modeled on `test/unit/modules/sf-symbols-lab/manifest.test.ts`):

| # | Invariant | Source |
|---|---|---|
| 1 | `manifest.id === 'swiftui-interop'` | FR-001 |
| 2 | `manifest.id` matches `/^[a-z][a-z0-9-]*$/` | global registry rule |
| 3 | `new Set(manifest.platforms)` equals `new Set(['ios','android','web'])` | FR-001 |
| 4 | `manifest.minIOS === '16.0'` | FR-001, edge case |
| 5 | `typeof manifest.render === 'function'` and `React.isValidElement(manifest.render())` | global registry rule |
| 6 | `typeof manifest.title === 'string'` and non-empty | global registry rule |
| 7 | `typeof manifest.description === 'string'` and non-empty | global registry rule |

Asserted by the existing `test/unit/modules/registry.test.ts` (no edit
needed — it iterates `MODULES`):

- The new module's `id` is unique across `MODULES`.
- Source order is preserved.

## Behavioural contract

- Loading `src/modules/swiftui-interop/index.tsx` MUST NOT trigger
  any side effect at module-eval time — particularly MUST NOT import
  `@expo/ui/swift-ui` at the top level of `index.tsx`. The
  `@expo/ui/swift-ui` import lives only inside `screen.tsx` (and is
  resolved away on Android/Web by Metro picking `screen.android.tsx`
  / `screen.web.tsx` instead).
- `manifest.render()` MUST be safe to call once per route mount and
  MUST return a fresh React element each call.
