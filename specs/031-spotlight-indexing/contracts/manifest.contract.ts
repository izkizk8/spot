/**
 * Contract: registry manifest entry for the Spotlight Indexing module.
 *
 * @feature 031-spotlight-indexing
 * @see specs/031-spotlight-indexing/spec.md FR-001..003, AC-SPL-001, AC-SPL-009
 * @see src/modules/types.ts (project-wide ModuleManifest contract)
 *
 * Implementation file:
 *   - src/modules/spotlight-lab/index.tsx
 *
 * INVARIANTS (asserted by `manifest.test.ts`):
 *   M1. id === 'spotlight-lab' (kebab-case, unique per
 *       `src/modules/registry.ts` invariants).
 *   M2. title === 'Spotlight Indexing'.
 *   M3. platforms is ['ios','android','web'] (all three).
 *   M4. minIOS === '9.0'.
 *   M5. render is a pure function — no side effects at module
 *       load time; native-only deps are imported inside the
 *       function or its descendants (project-wide module manifest
 *       invariant; mirrors 030's M5).
 *   M6. Adding this entry grows `MODULES.length` by exactly 1
 *       (AC-SPL-001).
 */

import type { ReactNode } from 'react';

export interface SpotlightManifest {
  readonly id: 'spotlight-lab';
  readonly title: 'Spotlight Indexing';
  readonly description: string;
  readonly icon: {
    readonly ios: string; // SF Symbol; e.g. 'magnifyingglass.circle'
    readonly fallback: string;
  };
  readonly platforms: readonly ['ios', 'android', 'web'];
  readonly minIOS: '9.0';
  readonly render: () => ReactNode;
}

/** Suggested SF Symbol; the test asserts only that ios+fallback are non-empty strings. */
export const SUGGESTED_IOS_ICON = 'magnifyingglass.circle' as const;

/** Frozen literals for the manifest invariants above. */
export const MANIFEST_ID = 'spotlight-lab' as const;
export const MANIFEST_TITLE = 'Spotlight Indexing' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '9.0' as const;
