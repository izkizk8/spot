# Feature 087 — Control Center Custom Controls

**Status**: Specified
**Branch**: `087-controls`
**Parent**: `053-swiftdata`

## Summary

An additive iOS 18+ educational module demonstrating **Control Center
custom action buttons**: the `ControlWidget` SwiftUI surface,
`ControlValueProvider` for live state, and `AppIntent`-driven actions
triggered when a user taps a registered control from Control Center.

This is the 49th module in the showcase registry. It mirrors the
established lab-module shape: a manifest, an iOS screen, Android/web
gates, a thin `requireOptionalNativeModule`-resolved Swift bridge,
and JS-pure unit tests with the native module mocked at the import
boundary.

A small `with-controls` Expo config plugin sets
`NSSupportsControlCenter = true` in the iOS `Info.plist` to document
that the app ships `ControlWidget` extensions.

## User stories

- **US1** (must) — As a developer studying iOS 18 Controls, I open the
  *Control Center* module on iOS and see which Controls APIs are
  available on the current device.
- **US2** (must) — I see a list of registered control descriptors with
  their kind (button / toggle), title, and SF Symbol name.
- **US3** (must) — I can simulate triggering a control and see the
  resulting `ControlActionResult` (success, new value, timestamp).
- **US4** (must) — I see a setup guide explaining how to add a Widget
  Extension target, declare a `ControlWidget`, implement
  `ControlValueProvider`, define the backing `AppIntent`, and add the
  control to Control Center via Settings.
- **US5** (must) — On Android and web the module still loads but
  surfaces a clear "iOS Only Feature" banner.

## Functional requirements

- **FR1** — A `controls-lab` `ModuleManifest` registered at the tail
  of `src/modules/registry.ts` with
  `platforms: ['ios','android','web']` and `minIOS: '18.0'`.
- **FR2** — A JS bridge `src/native/controls.ts` resolving the
  `SpotControls` Expo Module via `requireOptionalNativeModule`, plus
  matching `controls.android.ts` / `controls.web.ts` stubs that reject
  every method with `ControlsNotSupported`. Methods:
  `getCapabilities`, `getRegisteredControls`, `triggerControl`.
- **FR3** — Module screens: `screen.tsx` (iOS), `screen.android.tsx`,
  `screen.web.tsx` (Android/web both render `IOSOnlyBanner`).
- **FR4** — Components: `IOSOnlyBanner`, `CapabilityCard`,
  `ControlItem`, `SetupGuide` (4 components).
- **FR5** — Hook `hooks/useControls.ts` exposing capability +
  registered-controls state + last action result, with
  `__setControlsBridgeForTests` for swap-at-import-boundary testing.
- **FR6** — A `with-controls` Expo config plugin that sets
  `NSSupportsControlCenter = true` in `Info.plist`. The plugin is
  registered in `app.json` immediately before `expo-sensors`,
  bumping the plugin count from 42 to 43.
- **FR7** — Coexistence tests for the six existing plugins
  (`with-mapkit`, `with-apple-pay`, `with-coredata-cloudkit`,
  `with-roomplan`, `with-storekit`, `with-weatherkit`) are updated
  from `toBe(42)` to `toBe(43)`.

## Non-functional requirements

- **NFR1** — Additive only: no existing test, file, or behaviour is
  removed or amended (other than the count bump in FR7).
- **NFR2** — `pnpm check` (format + lint + typecheck + test) must pass
  green from a clean tree.
- **NFR3** — No `eslint-disable` directives anywhere in the new code.
- **NFR4** — `pnpm format` is run before commit.
- **NFR5** — Native bridges are mocked at the import boundary in
  tests; no `SpotControls` symbols are imported by the test runner.

## Out of scope

- Compiling or running a real `ControlWidget` Swift extension.
- Authoring a real `AppIntent` that mutates app state from Control
  Center.
- Persistence of control state across reloads in the JS hook
  (state is in-memory).
