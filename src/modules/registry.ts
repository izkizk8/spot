import type { ModuleManifest } from './types';
// Add new modules here ↓ One import line per module.
import liveActivityDemo from './live-activity-demo';
import liquidGlassPlayground from './liquid-glass-playground';
import hapticsPlayground from './haptics-playground';
import sfSymbolsLab from './sf-symbols-lab';
import swiftuiInterop from './swiftui-interop';

/**
 * The source-order list of module manifests rendered in the Modules tab
 * and routable at `/modules/[id]`.
 *
 * # Adding a new module (≤ 10 minutes — SC-006)
 *
 * 1. Create `src/modules/<your-id>/index.ts` and export a default
 *    `ModuleManifest` (see `src/modules/types.ts`).
 * 2. Add ONE import line above and ONE entry below — that's the entire
 *    contract. Nothing else in the shell needs to change.
 *
 * Invariants (enforced by `test/unit/modules/registry.test.ts` +
 * `manifest.test.ts`):
 *   - `id` matches `/^[a-z][a-z0-9-]*$/`
 *   - `MODULES.map(m => m.id)` has no duplicates
 *   - empty array is valid (Modules tab renders an empty state)
 *   - source-order is the rendered order
 */
export const MODULES: readonly ModuleManifest[] = [
  liquidGlassPlayground,
  liveActivityDemo,
  hapticsPlayground,
  sfSymbolsLab,
  swiftuiInterop,
  // ↑ Append new manifests here in the order they should appear.
];
