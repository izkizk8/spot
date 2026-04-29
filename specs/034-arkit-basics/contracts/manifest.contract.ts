/**
 * Contract: registry manifest entry for the ARKit Basics module.
 *
 * @feature 034-arkit-basics
 * @see specs/034-arkit-basics/spec.md FR-001, FR-002
 * @see src/modules/types.ts (project-wide ModuleManifest contract)
 *
 * Implementation file:
 *   - src/modules/arkit-lab/index.tsx
 *
 * INVARIANTS (asserted by `manifest.test.ts`):
 *   M1. id === 'arkit-basics' (kebab-case, unique per
 *       `src/modules/registry.ts` invariants).
 *   M2. title === 'ARKit Basics'.
 *   M3. platforms is ['ios','android','web'] (all three).
 *   M4. minIOS === '11.0'.
 *   M5. render is a pure function — no side effects at module load
 *       time; native-only deps are imported inside the function or
 *       its descendants (project-wide module manifest invariant;
 *       mirrors 030 / 031 / 032 / 033 M5).
 *   M6. Adding this entry grows `MODULES.length` by exactly 1
 *       (SC-007).
 */

import type { ReactNode } from 'react';

export interface ARKitBasicsManifest {
  readonly id: 'arkit-basics';
  readonly title: 'ARKit Basics';
  readonly description: string;
  readonly icon: {
    readonly ios: string; // SF Symbol; e.g. 'arkit'
    readonly fallback: string;
  };
  readonly platforms: readonly ['ios', 'android', 'web'];
  readonly minIOS: '11.0';
  readonly render: () => ReactNode;
}

/** Suggested SF Symbol; the test asserts only that ios+fallback are non-empty strings. */
export const SUGGESTED_IOS_ICON = 'arkit' as const;

/** Frozen literals for the manifest invariants above. */
export const MANIFEST_ID = 'arkit-basics' as const;
export const MANIFEST_TITLE = 'ARKit Basics' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '11.0' as const;
