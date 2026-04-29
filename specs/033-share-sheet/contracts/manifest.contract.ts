/**
 * Contract: registry manifest entry for the Share Sheet module.
 *
 * @feature 033-share-sheet
 * @see specs/033-share-sheet/spec.md FR-001, FR-002
 * @see src/modules/types.ts (project-wide ModuleManifest contract)
 *
 * Implementation file:
 *   - src/modules/share-sheet-lab/index.tsx
 *
 * INVARIANTS (asserted by `manifest.test.ts`):
 *   M1. id === 'share-sheet' (kebab-case, unique per
 *       `src/modules/registry.ts` invariants).
 *   M2. title === 'Share Sheet'.
 *   M3. platforms is ['ios','android','web'] (all three).
 *   M4. minIOS === '8.0'.
 *   M5. render is a pure function — no side effects at module load
 *       time; native-only deps are imported inside the function or
 *       its descendants (project-wide module manifest invariant;
 *       mirrors 030 / 031 / 032 M5).
 *   M6. Adding this entry grows `MODULES.length` by exactly 1
 *       (SC-008).
 */

import type { ReactNode } from 'react';

export interface ShareSheetManifest {
  readonly id: 'share-sheet';
  readonly title: 'Share Sheet';
  readonly description: string;
  readonly icon: {
    readonly ios: string; // SF Symbol; e.g. 'square.and.arrow.up'
    readonly fallback: string;
  };
  readonly platforms: readonly ['ios', 'android', 'web'];
  readonly minIOS: '8.0';
  readonly render: () => ReactNode;
}

/** Suggested SF Symbol; the test asserts only that ios+fallback are non-empty strings. */
export const SUGGESTED_IOS_ICON = 'square.and.arrow.up' as const;

/** Frozen literals for the manifest invariants above. */
export const MANIFEST_ID = 'share-sheet' as const;
export const MANIFEST_TITLE = 'Share Sheet' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '8.0' as const;
