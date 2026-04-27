# Quickstart: iOS Feature Showcase

## Prerequisites

- Node 20+ and pnpm (project uses pnpm with `nodeLinker: hoisted`).
- iOS 17+ device or simulator for the full Liquid Glass experience
  (Android and web show documented fallbacks).
- All existing project tooling already installed (`pnpm install`).

## Install the new dependency

```sh
npx expo install @react-native-async-storage/async-storage
```

This is the single new runtime dependency for this feature. It is the
canonical Expo-supported local KV store and is used solely for theme
preference persistence (key `spot.theme.preference`).

## Run the app

```sh
pnpm start             # interactive launcher
pnpm ios               # iOS simulator
pnpm android           # Android emulator
pnpm web               # web (Metro)
```

You should see four tabs: **Home**, **Explore**, **Modules**, **Settings**.

## Try the feature

1. **Home**: polished theme-aware hero showcase. Renders on all platforms.
2. **Modules**: grid of cards. The Liquid Glass Playground card is
   visible everywhere; on Android/web the platform-fallback badge
   indicates the experience is degraded.
3. **Liquid Glass Playground**: tap the card. Adjust the blur intensity,
   tint chip, and shape segmented control. On iOS, three glass surfaces
   react live. On Android, a translucent material fallback renders. On
   web, a CSS `backdrop-filter` fallback renders.
4. **Settings**: pick System / Light / Dark. Every visible surface
   updates immediately. Quit and relaunch — your selection is restored.

## Add a new module (≤ 10 minutes — SC-006)

1. Create the folder and manifest:

   ```sh
   mkdir src/modules/my-new-module
   ```

   ```ts
   // src/modules/my-new-module/index.ts
   import type { ModuleManifest } from '@/modules/types';
   import { MyScreen } from './screen';

   const manifest: ModuleManifest = {
     id: 'my-new-module',
     title: 'My New Module',
     description: 'A delightful one-line description.',
     icon: { ios: 'sparkles', fallback: '✦' },
     platforms: ['ios', 'android', 'web'],
     render: () => <MyScreen />,
   };

   export default manifest;
   ```

2. Register it (the only edit outside the new folder):

   ```ts
   // src/modules/registry.ts
   import myNewModule from './my-new-module';

   export const MODULES = [
     liquidGlassPlayground,
     myNewModule, // ← appended
   ] as const;
   ```

3. Run the app — your module is in the Modules grid and routable at
   `/modules/my-new-module`.

## Quality gates

Before merging:

```sh
pnpm format       # oxfmt
pnpm lint         # oxlint + eslint
pnpm typecheck    # tsc --noEmit
pnpm test         # jest
pnpm check        # all of the above in one shot
```

All five MUST pass (FR-028, SC-007).

## Manual verification matrix

| Scenario | iOS | Android | Web |
|---|---|---|---|
| Home hero renders | ✓ | ✓ | ✓ |
| Modules tab populated from registry | ✓ | ✓ | ✓ |
| Empty-registry state (temporarily empty `MODULES`) | ✓ | ✓ | ✓ |
| Liquid Glass three surfaces respond live | ✓ | fallback ✓ | fallback ✓ |
| Theme switch propagates within 500 ms | ✓ | ✓ | ✓ |
| Theme persists across cold launch | ✓ | ✓ | ✓ |
| Tapping unsupported module on Android/web does not crash | ✓ | ✓ | ✓ |
