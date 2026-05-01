import type { ReactNode } from 'react';

/** SF Symbol name on iOS (via expo-symbols). */
export type SFSymbolName = string;

/** Platforms a module declares it supports. */
export type ModulePlatform = 'ios' | 'android' | 'web';

/** A module's icon, with a documented fallback identifier for non-iOS. */
export interface ModuleIcon {
  /** SF Symbol name used on iOS. */
  readonly ios: SFSymbolName;
  /**
   * Stable identifier used as a fallback on Android/web. May be rendered
   * as a glyph string (e.g. "✦") or mapped to a future icon set.
   */
  readonly fallback: string;
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
