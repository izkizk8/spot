# Feature 057 — PhotoKit Lab

**Status**: Specified
**Branch**: `057-photokit`
**Parent**: `053-swiftdata`

## Summary

An additive iOS-14+ educational module demonstrating **PHPickerViewController**, Apple's
modern permission-less photo-library picker introduced in iOS 14. The module wraps
`PHPickerViewController` behind an Expo module bridge, exposes photo-library authorization
(for full write access), lets the user pick images/videos, and displays the selected assets
in a grid with metadata.

This is the 49th module in the showcase registry. It follows the established lab-module
shape: a manifest, an iOS screen, Android/web gates, an iOS-only native bridge, a config
plugin for `NSPhotoLibraryUsageDescription`, and JS-pure unit tests with the native bridge
mocked at the import boundary.

## User stories

- **US1** (must) — As a developer studying PhotoKit, I open the *PhotoKit* module on iOS
  and see the current photo-library authorization status.
- **US2** (must) — I can tap *Request Access* to trigger `PHPhotoLibrary.requestAuthorization`
  and see the status update.
- **US3** (must) — I can tap *Pick Photos* to open `PHPickerViewController` and select images
  or videos.
- **US4** (must) — After picking, the selected assets (URI, filename, dimensions, media type,
  creation date) appear in a scrollable grid.
- **US5** (should) — I see a capability card showing the authorization status and the iOS version
  requirement.
- **US6** (must) — I see setup instructions explaining `NSPhotoLibraryUsageDescription`,
  `PHPickerViewController` configuration, and the difference between limited and full access.
- **US7** (must) — On Android and web the module loads but surfaces a clear "iOS only" banner.

## Functional requirements

- **FR1** — A `photokit-lab` `ModuleManifest` registered at the tail of `src/modules/registry.ts`
  with `platforms: ['ios', 'android', 'web']` and `minIOS: '14.0'`.
- **FR2** — A JS bridge `src/native/photokit.ts` resolving the `PhotoKit` Expo Module via
  `requireOptionalNativeModule` plus matching `photokit.android.ts` / `photokit.web.ts` stubs.
  Methods:
  - `requestAuthorization(): Promise<AuthorizationStatus>`
  - `getAuthorizationStatus(): Promise<AuthorizationStatus>`
  - `presentPicker(config?: PickerConfig): Promise<readonly PhotoAsset[]>`
- **FR3** — A `usePhotoKit` hook in `src/modules/photokit-lab/hooks/usePhotoKit.ts` that manages
  authorization status, picked assets, loading state, and last error. Exposes
  `__setPhotoKitBridgeForTests` for unit-test injection.
- **FR4** — An Expo config plugin `plugins/with-photokit/` that idempotently sets
  `NSPhotoLibraryUsageDescription` in `ios.infoPlist`.
- **FR5** — `plugins/with-photokit` entry appended to `app.json` `plugins` array.
- **FR6** — Module registered at the tail of `MODULES` in `src/modules/registry.ts`.
- **FR7** — iOS screen with CapabilityCard, PhotoPicker button, PhotoGrid, and SetupInstructions.
- **FR8** — `screen.android.tsx` and `screen.web.tsx` show `IOSOnlyBanner`.

## Non-functional requirements

- Zero `eslint-disable` comments.
- All components use `ThemedText` / `ThemedView` and `Spacing` scale.
- Native bridge mocked at import boundary in all unit tests.
- `pnpm format && pnpm check` green on the feature branch.
