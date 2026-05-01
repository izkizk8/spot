# Tasks — Feature 070 iCloud Drive

## T001 — Bridge types
Create `src/native/icloud-drive.types.ts` with `ICloudFileItem`, `ICloudDriveBridge`, and `ICloudDriveNotAvailable`.

## T002 — iOS bridge
Create `src/native/icloud-drive.ts` (iOS, `requireOptionalNativeModule`).

## T003 — Android stub
Create `src/native/icloud-drive.android.ts` (rejects all).

## T004 — Web stub
Create `src/native/icloud-drive.web.ts` (rejects all).

## T005 — Hook
Create `src/modules/icloud-drive-lab/hooks/useICloudDrive.ts` with `__setICloudDriveBridgeForTests`.

## T006 — Module manifest
Create `src/modules/icloud-drive-lab/index.tsx`.

## T007 — iOS screen
Create `src/modules/icloud-drive-lab/screen.tsx`.

## T008 — Android screen
Create `src/modules/icloud-drive-lab/screen.android.tsx`.

## T009 — Web screen
Create `src/modules/icloud-drive-lab/screen.web.tsx`.

## T010 — Components
Create EntitlementBanner, FileList, FileActions, SetupInstructions.

## T011 — Plugin
Create `plugins/with-icloud-drive/index.ts` + `package.json`. Add to `app.json`.

## T012 — Registry
Register `icloud-drive-lab` in `src/modules/registry.ts`.

## T013 — Unit tests
Create `test/unit/modules/070-icloud-drive/` and `test/unit/plugins/with-icloud-drive/`.

## T014 — Bump mapkit plugin test count
Update `test/unit/plugins/with-mapkit/index.test.ts` plugin count 43→44.
