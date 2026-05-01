# Contract: `ModuleManifest`

The TypeScript interface every module under `src/modules/<id>/` MUST export
as its default value from `index.ts`. This is the *only* coupling between
a module and the shell.

## Source location

`src/modules/types.ts`

## TypeScript declaration

```ts
import type { ReactNode } from 'react';

/** SF Symbol name on iOS (via expo-symbols). */
export type SFSymbolName = string;

/** Platforms a module declares it supports. */
export type ModulePlatform = 'ios' | 'android' | 'web';

/** A module's icon, with a documented fallback identifier for non-iOS. */
export interface ModuleIcon {
  /** SF Symbol name used on iOS. */
  ios: SFSymbolName;
  /**
   * Stable identifier used as a fallback on Android/web. May be rendered
   * as a glyph string (e.g. "✦") or mapped to a future icon set.
   */
  fallback: string;
}

/**
 * The contract every module must export as `default` from its `index.ts`.
 *
 * Adding a new module:
 *   1. Create `src/modules/<id>/index.ts` exporting a `ModuleManifest`.
 *   2. Add a single import line to `src/modules/registry.ts` and
 *      include the imported manifest in the `MODULES` array.
 * No other file in the shell needs to change.
 */
export interface ModuleManifest {
  /** Stable, unique, kebab-case. Used as route id and React key. */
  readonly id: string;

  /** Human-readable card title. */
  readonly title: string;

  /** One-sentence card subtitle. */
  readonly description: string;

  /** SF Symbol on iOS plus a fallback identifier for Android/web. */
  readonly icon: ModuleIcon;

  /** Non-empty subset of supported platforms. */
  readonly platforms: ReadonlyArray<ModulePlatform>;

  /**
   * Optional minimum iOS version. If present and the device's iOS version
   * is lower, the module is marked unavailable on iOS and its `render`
   * function MUST NOT be invoked.
   */
  readonly minIOS?: string;

  /**
   * Component invocation for the module's detail screen.
   * Called by `app/modules/[id].tsx` when the user opens the module.
   * MUST be a pure function returning a React node; MUST NOT perform
   * side effects at module load time (FR-018 — native-only deps stay
   * inside this function or its descendants).
   */
  readonly render: () => ReactNode;
}
```

## Registry barrel

`src/modules/registry.ts`:

```ts
import type { ModuleManifest } from './types';
import liquidGlassPlayground from './liquid-glass-playground';
// Add new modules here. ↓ One import line per module.

export const MODULES: readonly ModuleManifest[] = [
  liquidGlassPlayground,
  // ↑ Append new manifests here in the order they should appear.
];
```

## Invariants (test-enforced)

- Manifest `id` matches `/^[a-z][a-z0-9-]*$/`.
- `platforms.length >= 1`; every element ∈ `{ 'ios', 'android', 'web' }`.
- `minIOS`, if present, matches `/^\d+(\.\d+){0,2}$/`.
- `render` is a function.
- `MODULES.map(m => m.id)` has no duplicates.

## Consumer responsibilities

- `src/app/modules/index.tsx` MUST render one card per entry of `MODULES`,
  preserving array order, applying platform-availability badges derived
  from `platforms` and (on iOS) `minIOS`.
- `src/app/modules/[id].tsx` MUST look up the requested id in `MODULES`
  and either invoke `manifest.render()` or render a graceful unavailable
  view if the id is unknown OR the module is unavailable on the current
  platform.
- The Modules screen MUST NOT crash on an empty registry; it MUST render
  a friendly empty state.

## Stability

This contract is **stable** for the lifetime of this feature. Breaking
changes require a new spec.
