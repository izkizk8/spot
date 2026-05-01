# Feature Specification: LiDAR + RoomPlan Module

**Feature Branch**: `048-lidar-roomplan`
**Feature Number**: 048
**Created**: 2026-05-12
**Status**: Approved (autonomous, no clarifications)
**Parent Branch**: `047-shareplay`

## Summary

iOS 16+ educational module that demonstrates Apple's **RoomPlan**
framework. Uses `RoomCaptureSession` (LiDAR-only) to scan a room and
return a 3D parametric model — walls, windows, doors, openings, and
objects. The captured model can be exported as a USDZ file and shared
through the iOS Share Sheet (re-using the bridge built for feature
033).

Adds a "LiDAR / RoomPlan" card to the 006 iOS Showcase registry
(`id: 'lidar-roomplan-lab'`,
`platforms: ['ios','android','web']`,
`minIOS: '16.0'`).

The module ships a thin Swift bridge (`native/ios/lidar-roomplan/`)
exposing `RoomCaptureSession` + `RoomCaptureView`. The bridge is
mocked at the import boundary in unit tests
(`__setRoomPlanBridgeForTests`).

## Sections / UX

1. **Capability card** — shows
   `RoomCaptureSession.isSupported` (LiDAR-only).
2. **Scan button (`ScanLauncher`)** — launches a `RoomCaptureView`
   session via the thin native bridge.
3. **Live status card** — current scanning phase
   (`idle` / `scanning` / `processing` / `completed` / `error`)
   plus contextual instructions.
4. **Captured rooms list (`RoomsList`)** — saved scans with id,
   name, dimensions, surface count, and createdAt.
5. **Selected room viewer (`RoomDetailView`)** — dimensions plus
   surfaces breakdown (walls / windows / doors / openings /
   objects); **Export USDZ** button (re-uses Share Sheet from 033).
6. **Storage (`room-store.ts`)** — AsyncStorage list of scan
   metadata plus on-disk USDZ paths.
7. **IOSOnlyBanner** — Android / Web only. Explains the framework
   is iOS 16+, LiDAR-only.

## Decisions

- **Plugin: `plugins/with-roomplan/`** — only ensures
  `NSCameraUsageDescription` is present (already added by
  feature 017's `with-vision` and feature 034's `with-arkit`).
  Coexists; no other Info.plist keys, no entitlements.
  Idempotent (running twice produces a deep-equal config).
- **`app.json` plugins array** is bumped from 37 → 38 (insert
  `./plugins/with-roomplan` after `./plugins/with-weatherkit`).
  The `with-mapkit` and `with-weatherkit` coexistence assertions
  are bumped from 37 → 38.
- **Tests** are JS-pure; the native bridge is mocked at the
  import boundary via `__setRoomPlanBridgeForTests`.
- **Frozen scanning-phase catalog** lives in `phases.ts` style as
  inline string-literal types in `roomplan.types.ts`.
- **Unit conversion** (m → ft / in) lives in `units-utils.ts` so
  the JS surface is testable without ever touching native code.
- **Export path** — the bridge persists the USDZ on-device and
  returns the file URI. The `ExportButton` then routes that URI
  through the existing share-sheet bridge (`@/native/share-sheet`)
  with a `kind: 'file'` payload (mime `model/vnd.usdz+zip`).

## Acceptance criteria

- The module appears as the 43rd entry in the registry, after
  `shareplay-lab`.
- `pnpm check` is green.
- All new tests pass (JS-pure; no native module is ever loaded).
- The plugin coexists with `with-vision`, `with-arkit`, `with-mapkit`,
  `with-weatherkit`, and the rest of the chain without throwing.
