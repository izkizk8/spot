# Implementation Plan — 048-lidar-roomplan

## Files

### Native (iOS)
- `native/ios/lidar-roomplan/RoomCaptureBridge.swift` — Expo
  Module wrapping `RoomCaptureSession` and `RoomCaptureView`.
  Methods: `isSupported`, `startCapture` (resolves to a
  `RoomCaptureResult`), `stopCapture`, `exportUSDZ(roomId)`,
  `addStateListener`.
- `native/ios/lidar-roomplan/RoomPlan.podspec`.
- `native/ios/lidar-roomplan/expo-module.config.json`.

### JS bridge
- `src/native/roomplan.types.ts` — shared types
  (`RoomCaptureResult`, `RoomDimensions`, `SurfaceCounts`,
  `ScanPhase`, `RoomPlanBridge`, `RoomPlanNotSupported`).
- `src/native/roomplan.ts` — iOS variant.
- `src/native/roomplan.android.ts` — rejects with
  `RoomPlanNotSupported`.
- `src/native/roomplan.web.ts` — rejects with
  `RoomPlanNotSupported`.

### Module
- `src/modules/lidar-roomplan-lab/index.tsx` — manifest.
- `src/modules/lidar-roomplan-lab/screen.tsx` — iOS screen.
- `src/modules/lidar-roomplan-lab/screen.android.tsx`.
- `src/modules/lidar-roomplan-lab/screen.web.tsx`.
- `src/modules/lidar-roomplan-lab/units-utils.ts` —
  pure metres-to-feet/inches conversion + dimension formatters.
- `src/modules/lidar-roomplan-lab/room-store.ts` — AsyncStorage
  list of scan metadata.
- `src/modules/lidar-roomplan-lab/hooks/useRoomCapture.ts` —
  full lifecycle hook + `__setRoomPlanBridgeForTests`.
- `src/modules/lidar-roomplan-lab/components/{CapabilityCard,
  ScanLauncher, LiveStatusCard, RoomsList, RoomDetailView,
  ExportButton, IOSOnlyBanner}.tsx`.

### Plugin
- `plugins/with-roomplan/index.ts` — adds
  `NSCameraUsageDescription` if absent (coexists with 017 / 034).
  No other keys.
- `plugins/with-roomplan/package.json`.

### Tests (JS-pure)
- `test/unit/native/roomplan.test.ts` — bridge contract.
- `test/unit/modules/lidar-roomplan-lab/manifest.test.ts`.
- `test/unit/modules/lidar-roomplan-lab/registry.test.ts`.
- `test/unit/modules/lidar-roomplan-lab/units-utils.test.ts`.
- `test/unit/modules/lidar-roomplan-lab/room-store.test.ts`.
- `test/unit/modules/lidar-roomplan-lab/hooks/useRoomCapture.test.tsx`.
- `test/unit/modules/lidar-roomplan-lab/screen.test.tsx`.
- `test/unit/modules/lidar-roomplan-lab/screen.android.test.tsx`.
- `test/unit/modules/lidar-roomplan-lab/screen.web.test.tsx`.
- `test/unit/modules/lidar-roomplan-lab/components/{CapabilityCard,
  ScanLauncher, LiveStatusCard, RoomsList, RoomDetailView,
  ExportButton, IOSOnlyBanner}.test.tsx` (×7).
- `test/unit/plugins/with-roomplan/index.test.ts`.

### Wiring
- `src/modules/registry.ts` — append `lidarRoomplanLab`.
- `app.json` — insert `./plugins/with-roomplan` after
  `./plugins/with-weatherkit` (length 37 → 38).
- `test/unit/plugins/with-mapkit/index.test.ts` — bump 37 → 38.
- `test/unit/plugins/with-weatherkit/index.test.ts` — bump 37 → 38.

## Constraints

- Additive-only.
- No `eslint-disable`.
- `pnpm format` before commit.
- Native bridges mocked at import boundary.
- Plugin must coexist with feature 017 (`with-vision`) and 034
  (`with-arkit`) without overwriting their
  `NSCameraUsageDescription` value.
