# Plan — Feature 083: Live Stickers

## Overview

Deliver the Live Stickers educational lab by wiring a JS-layer bridge
over a stub Expo Module, a React hook state machine, three platform
screens, an Expo config plugin for photo-library permissions, and a
complete unit-test suite — all following the established lab-module
conventions.

## Layers & files

### 1. Native bridge

| File | Purpose |
|------|---------|
| `src/native/live-stickers.types.ts` | Shared types: `StickerSubject`, `LiveStickersResult`, `LiveStickersError`, `LiveStickersBridge`, `LiveStickersNotSupported` |
| `src/native/live-stickers.ts` | iOS variant — `requireOptionalNativeModule('LiveStickers')` |
| `src/native/live-stickers.android.ts` | Android stub — all methods reject with `UNSUPPORTED_OS` |
| `src/native/live-stickers.web.ts` | Web stub — all methods reject with `UNSUPPORTED_OS` |

### 2. Module

| File | Purpose |
|------|---------|
| `src/modules/live-stickers-lab/index.tsx` | `ModuleManifest` — `id: 'live-stickers-lab'`, deferred `require('./screen')` |
| `src/modules/live-stickers-lab/hooks/useLiveStickers.ts` | Hook + `__setLiveStickersBridgeForTests` test seam |
| `src/modules/live-stickers-lab/components/IOSOnlyBanner.tsx` | Non-iOS gate banner with `testID` |
| `src/modules/live-stickers-lab/screen.tsx` | iOS main screen |
| `src/modules/live-stickers-lab/screen.android.tsx` | Android gate |
| `src/modules/live-stickers-lab/screen.web.tsx` | Web gate |

### 3. Plugin

| File | Purpose |
|------|---------|
| `plugins/with-live-stickers/index.ts` | Writes `NSPhotoLibraryUsageDescription` idempotently |
| `plugins/with-live-stickers/package.json` | Private package manifest |

### 4. Registry

- Add import + entry to `src/modules/registry.ts`.
- Add `./plugins/with-live-stickers` to `app.json` (after `with-coredata-cloudkit`).

### 5. Tests

| File | Coverage |
|------|---------|
| `test/unit/modules/083-live-stickers/manifest.test.ts` | Module manifest shape |
| `test/unit/modules/083-live-stickers/useLiveStickers.test.tsx` | Hook state machine |
| `test/unit/modules/083-live-stickers/screen.test.tsx` | iOS screen UI |
| `test/unit/modules/083-live-stickers/screen.android.test.tsx` | Android IOSOnlyBanner |
| `test/unit/modules/083-live-stickers/screen.web.test.tsx` | Web IOSOnlyBanner |
| `test/unit/plugins/with-live-stickers/index.test.ts` | Plugin idempotency + chain |

## Quality gates

- `pnpm format && pnpm check` green
- All existing `toBe(42)` plugin-count assertions bumped to `toBe(43)`
- Zero `eslint-disable` directives
