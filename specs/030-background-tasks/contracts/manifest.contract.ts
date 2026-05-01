/**
 * Contract: registry manifest entry for the BackgroundTasks module.
 *
 * @feature 030-background-tasks
 * @see specs/030-background-tasks/spec.md FR-001..003, AC-BGT-001, AC-BGT-009
 * @see src/modules/types.ts (project-wide ModuleManifest contract)
 *
 * Implementation file:
 *   - src/modules/background-tasks-lab/index.tsx
 *
 * INVARIANTS (asserted by `manifest.test.ts`):
 *   M1. id === 'background-tasks-lab' (kebab-case, unique).
 *   M2. title === 'Background Tasks'.
 *   M3. platforms is ['ios','android','web'] (all three).
 *   M4. minIOS === '13.0'.
 *   M5. render is a pure function — no side effects at module
 *       load time; native-only deps are imported inside the
 *       function or its descendants (project-wide FR-018 for
 *       module manifests).
 *   M6. Adding this entry grows `MODULES.length` by exactly 1
 *       (AC-BGT-001).
 */

import type { ReactNode } from 'react';

export interface BackgroundTasksManifest {
  readonly id: 'background-tasks-lab';
  readonly title: 'Background Tasks';
  readonly description: string;
  readonly icon: {
    readonly ios: string; // SF Symbol; e.g. 'clock.arrow.circlepath'
    readonly fallback: string;
  };
  readonly platforms: readonly ['ios', 'android', 'web'];
  readonly minIOS: '13.0';
  readonly render: () => ReactNode;
}

/** Suggested SF Symbol; the test asserts only that ios+fallback are non-empty strings. */
export const SUGGESTED_IOS_ICON = 'clock.arrow.circlepath' as const;

/** Frozen literals for the manifest invariants above. */
export const MANIFEST_ID = 'background-tasks-lab' as const;
export const MANIFEST_TITLE = 'Background Tasks' as const;
export const MANIFEST_PLATFORMS = ['ios', 'android', 'web'] as const;
export const MANIFEST_MIN_IOS = '13.0' as const;
