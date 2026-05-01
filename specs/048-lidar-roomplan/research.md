# Research — 048-lidar-roomplan

## Frameworks

### RoomPlan (iOS 16+)
- `RoomCaptureSession` — runs the LiDAR-backed capture; only
  available on devices with a LiDAR scanner
  (`RoomCaptureSession.isSupported`).
- `RoomCaptureView` — system UI for the capture experience.
- `RoomCaptureResult.CapturedRoom` — parametric model (walls,
  windows, doors, openings, objects).
- `CapturedRoom.export(to:URL,exportOptions:.parametric)` —
  writes a USDZ asset to disk.

### Info.plist requirements
- **`NSCameraUsageDescription`** — required (`AVCaptureDevice`
  usage). Already provided by feature 017's `with-vision` and
  feature 034's `with-arkit`. The 048 plugin therefore only
  ensures the key is present without overwriting the value.

### Entitlements / capabilities
- **None.** RoomPlan does not require an Apple Developer
  capability or special entitlement.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| R-A | Add a config plugin even though no new Info.plist key is required. | Documents the dependency explicitly so a teardown of `with-vision`/`with-arkit` does not silently break this module. The plugin is a no-op on a baseline that already has the key. |
| R-B | Persist USDZ files via the native bridge (in app `Documents/`) and surface the file URI to JS. | Avoids transferring binary blobs across the bridge; the share sheet (033) already accepts `kind: 'file'` payloads with a URI. |
| R-C | Mock the bridge at the import boundary in tests via `__setRoomPlanBridgeForTests`. | Mirrors the 047 / 034 patterns; the native module is never loaded in jsdom. |
| R-D | Keep the scanning-phase catalog inside `roomplan.types.ts` as a string-literal union (`'idle' \| 'scanning' \| 'processing' \| 'completed' \| 'error'`). | Adds a single source of truth without spinning up another data file. |

## Rejected alternatives

- **No plugin at all** (rely on 017 / 034). Rejected — the module
  reads as if it has no dependency on `NSCameraUsageDescription`,
  which is misleading; future refactors of `with-vision` /
  `with-arkit` could remove the key.
- **Always overwrite `NSCameraUsageDescription` with a RoomPlan
  copy.** Rejected — coexistence with 017 / 034 is required and
  the operator-supplied value must be preserved.
- **Return the parametric model as JSON across the bridge.**
  Rejected for v1 — the module focuses on the LiDAR scan +
  USDZ export pathway. A future iteration can extend
  `RoomCaptureResult` with serialised `CapturedRoom` data.
