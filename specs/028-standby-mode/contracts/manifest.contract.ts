/**
 * Contract: src/modules/standby-lab/index.tsx
 *
 * Documents the registry entry shape for the StandBy Mode module.
 * Feature 006 owns the `ModuleManifest` type; this contract pins
 * the values 028 commits to.
 *
 * Asserted by: test/unit/modules/standby-lab/manifest.test.ts.
 *
 * Spec refs: FR-SB-001, FR-SB-002, FR-SB-003, FR-SB-004.
 */

import type { ModuleManifest } from '@/modules/types';

/**
 * The exact registry entry the module exports as `default`.
 *
 * Test obligations:
 *   - `manifest.id === 'standby-lab'`
 *   - `manifest.title === 'StandBy Mode'`
 *   - `manifest.platforms` deep-equals `['ios', 'android', 'web']`
 *   - `manifest.minIOS === '17.0'`
 *   - `typeof manifest.render === 'function'`
 *   - `manifest.icon` provides BOTH `ios` (an SF Symbol name) AND
 *     `fallback` (a single-character emoji) — FR-SB-001 leaves the
 *     specific values to the implementer; the test asserts both
 *     keys are present and non-empty strings.
 *   - `manifest.description` is a non-empty string mentioning either
 *     "StandBy" (case-insensitive) or "iOS 17" so the modules grid
 *     description aligns with the spec's user-facing language.
 *
 * Cross-registry obligations (asserted by
 * `test/unit/modules/registry.test.ts`, which 028 may need to
 * extend if it pins a fixed array length):
 *   - `MODULES.find(m => m.id === 'standby-lab')` is defined.
 *   - `MODULES.length` increases by exactly 1 vs. the parent branch
 *     (i.e. registry size delta = +1 over 027's closing total).
 *   - No other manifest has `id === 'standby-lab'` (uniqueness).
 */
export declare const MANIFEST: ModuleManifest & {
  id: 'standby-lab';
  title: 'StandBy Mode';
  platforms: readonly ['ios', 'android', 'web'];
  minIOS: '17.0';
};
