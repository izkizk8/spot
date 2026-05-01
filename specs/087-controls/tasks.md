# Tasks — 087 Control Center Controls

Sequential tasks; each ends with `pnpm typecheck` succeeding. Final
gate: `pnpm check`.

## T1. Bridge contract

- Create `src/native/controls.types.ts` with `ControlKind`,
  `ControlInfo`, `ControlsCapabilities`, `ControlActionResult`,
  `ControlsBridge`, `ControlsNotSupported`.
- Create `src/native/controls.ts` with native resolver using
  `requireOptionalNativeModule`, throwing `ControlsNotSupported` on
  non-iOS or missing module.
- Create `src/native/controls.android.ts` and
  `src/native/controls.web.ts` rejecting every method.

## T2. Manifest, hook, components, screens

- `src/modules/controls-lab/index.tsx` — `ModuleManifest` with id
  `controls-lab`, lazy `render` of `./screen`, `minIOS: '18.0'`.
- `src/modules/controls-lab/hooks/useControls.ts` — capability +
  registered controls + last action result, observer-less surface,
  `__setControlsBridgeForTests`.
- 4 components: `IOSOnlyBanner`, `CapabilityCard`, `ControlItem`,
  `SetupGuide`.
- 3 screens: `screen.tsx` (iOS), `screen.android.tsx`,
  `screen.web.tsx`.

## T3. Plugin

- `plugins/with-controls/package.json` and `plugins/with-controls/index.ts`
  setting `NSSupportsControlCenter = true` via `withInfoPlist`.
- `applyControlsInfoPlist` exported as a pure helper.

## T4. Wiring

- Append `controlsLab` import + entry at the tail of
  `src/modules/registry.ts`.
- Insert `"./plugins/with-controls"` in `app.json` immediately before
  `expo-sensors` (count 42 → 43).
- Bump `expect(plugins.length).toBe(42)` → `toBe(43)` in the six
  coexistence tests.

## T5. Tests (10 files)

- `test/unit/modules/controls-lab/manifest.test.ts`
- `test/unit/modules/controls-lab/useControls.test.tsx`
- `test/unit/modules/controls-lab/screen.test.tsx`
- `test/unit/modules/controls-lab/screen.android.test.tsx`
- `test/unit/modules/controls-lab/screen.web.test.tsx`
- `test/unit/modules/controls-lab/components/IOSOnlyBanner.test.tsx`
- `test/unit/modules/controls-lab/components/CapabilityCard.test.tsx`
- `test/unit/modules/controls-lab/components/ControlItem.test.tsx`
- `test/unit/modules/controls-lab/components/SetupGuide.test.tsx`
- `test/unit/plugins/with-controls/index.test.ts`

## T6. Verify

- `pnpm format`
- `pnpm check`
- Verify zero `eslint-disable`.
- Commit.
