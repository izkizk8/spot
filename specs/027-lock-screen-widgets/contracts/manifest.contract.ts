/**
 * Contract: src/modules/lock-widgets-lab/index.tsx
 *
 * Documents the registry entry shape for the Lock Screen Widgets
 * module. Feature 006 owns the `ModuleManifest` type; this contract
 * pins the values 027 commits to.
 *
 * Asserted by: test/unit/modules/lock-widgets-lab/manifest.test.ts.
 *
 * Spec refs: FR-LW-001, FR-LW-002, FR-LW-003, FR-LW-004.
 */

import type { ModuleManifest } from '@/modules/types';

/**
 * The exact registry entry the module exports as `default`.
 *
 * Test obligations:
 *   - `manifest.id === 'lock-widgets-lab'`
 *   - `manifest.title === 'Lock Screen Widgets'`
 *   - `manifest.platforms` deep-equals `['ios', 'android', 'web']`
 *   - `manifest.minIOS === '16.0'`
 *   - `typeof manifest.render === 'function'`
 *   - `manifest.icon` provides BOTH `ios` (an SF Symbol name) AND
 *     `fallback` (a single-character emoji) — FR-LW-001 leaves this
 *     to the implementer; the test asserts both keys are present
 *     and non-empty strings.
 *   - `manifest.description` is a non-empty string mentioning either
 *     "lock" (case-insensitive) or "iOS 16" so the modules grid
 *     description aligns with the spec's user-facing language.
 *
 * Cross-registry obligations (asserted by
 * `test/unit/modules/registry.test.ts`, which 027 may need to extend
 * if it pins a fixed array length):
 *   - `MODULES.find(m => m.id === 'lock-widgets-lab')` is defined.
 *   - `MODULES.length` increases by exactly 1 vs. the parent branch.
 *   - No other manifest has `id === 'lock-widgets-lab'` (uniqueness).
 */
export declare const MANIFEST: ModuleManifest & {
  id: 'lock-widgets-lab';
  title: 'Lock Screen Widgets';
  platforms: readonly ['ios', 'android', 'web'];
  minIOS: '16.0';
};
