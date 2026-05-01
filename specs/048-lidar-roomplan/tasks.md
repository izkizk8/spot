# Tasks — 048-lidar-roomplan

- [x] T1  `src/native/roomplan.types.ts` — shared types and
       `RoomPlanNotSupported`.
- [x] T2  iOS / Android / Web bridge variants
       (`src/native/roomplan*.ts`).
- [x] T3  Swift bridge (`RoomCaptureBridge.swift`,
       `RoomPlan.podspec`, `expo-module.config.json`).
- [x] T4  `plugins/with-roomplan/` — ensures
       `NSCameraUsageDescription` exists; idempotent;
       coexists with 017 / 034.
- [x] T5  Module manifest + iOS / Android / Web screens.
- [x] T6  `units-utils.ts` — pure m→ft/in conversion +
       dimension formatters.
- [x] T7  `room-store.ts` — AsyncStorage list of scan
       metadata.
- [x] T8  `useRoomCapture` hook — full lifecycle, error
       surface, store integration, `__setRoomPlanBridgeForTests`.
- [x] T9  Seven components (CapabilityCard, ScanLauncher,
       LiveStatusCard, RoomsList, RoomDetailView,
       ExportButton, IOSOnlyBanner).
- [x] T10 Wire registry; insert plugin into `app.json`;
       bump `with-mapkit` and `with-weatherkit` count
       assertions from 37 to 38.
- [x] T11 Tests: bridge + manifest + registry + units-utils +
       room-store + hook + 3 screens + 7 components +
       plugin idempotency / coexistence.
- [x] T12 `pnpm format` + `pnpm check` green.
