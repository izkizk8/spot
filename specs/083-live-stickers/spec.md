# Feature 083 — Live Stickers

**Status**: Specified
**Branch**: `083-live-stickers`
**Parent**: `053-swiftdata`

## Summary

An additive iOS-17+ educational module showcasing **Live Stickers** (cut-out subjects) via
`VNGenerateForegroundInstanceMaskRequest`. Users pick a photo from their library, the Vision
framework isolates detected foreground subjects as transparent-background PNGs, and each subject
can be shared via the iOS share sheet (drag-and-drop to Messages).

This is the 49th module in the showcase registry. It mirrors the established lab-module shape:
a manifest, an iOS screen with a hook-backed state machine, Android/web gates, a thin JS bridge
over an Expo Module surface, an Expo config plugin for photo-library permissions, and JS-pure
unit tests with the native module mocked at the import boundary.

## User stories

- **US1** (must) — As a developer studying Vision, I open *Live Stickers* on iOS 17+ and see
  a "Pick Photo" button.
- **US2** (must) — After picking a photo, I see thumbnail previews of every lifted foreground
  subject.
- **US3** (must) — Each thumbnail has a "Share Sticker" button that opens the iOS share sheet
  with the sticker PNG.
- **US4** (must) — If no subject is found or the user cancels, I see a clear error / empty
  state message.
- **US5** (must) — On Android and web the module loads but shows a clear "iOS only" banner.
- **US6** (should) — A "Reset" button clears the current result set.

## Functional requirements

- **FR1** — A `live-stickers-lab` `ModuleManifest` registered at the tail of
  `src/modules/registry.ts` with `platforms: ['ios','android','web']` and `minIOS: '17.0'`.
- **FR2** — A JS bridge `src/native/live-stickers.ts` with `isSupported()`,
  `pickImageAndLiftSubjects()`, and `shareSticker(base64Png)`, plus matching
  `live-stickers.android.ts` / `live-stickers.web.ts` stubs that throw
  `LiveStickersNotSupported('UNSUPPORTED_OS')`.
- **FR3** — A `useLiveStickers` hook with `__setLiveStickersBridgeForTests` seam, exposing
  `isSupported`, `result`, `error`, `isLoading`, `pickAndLift()`, `shareSticker()`, `reset()`.
- **FR4** — An iOS screen (`screen.tsx`) rendering the full pick / lift / share flow.
- **FR5** — Android and web screens (`screen.android.tsx`, `screen.web.tsx`) rendering
  `IOSOnlyBanner` only.
- **FR6** — An Expo config plugin `plugins/with-live-stickers/index.ts` that writes
  `NSPhotoLibraryUsageDescription` idempotently.
- **FR7** — Unit tests covering the hook, all three screen variants, the module manifest, and
  the plugin — with no `eslint-disable` directives.

## Platform gating

| Platform | Behaviour |
|----------|-----------|
| iOS 17+  | Full subject-lift flow |
| iOS < 17 | `isSupported()` returns false; button disabled |
| Android  | `IOSOnlyBanner` |
| Web      | `IOSOnlyBanner` |

## Non-goals

- Real native Swift implementation (stub bridge only in JS layer)
- Animated sticker authoring
- iMessage app extension
