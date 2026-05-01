# Feature 082 — PencilKit Drawing Canvas — Plan

## Architecture

Follows the canonical **module + bridge** pattern used by feature 053
(`swiftdata-lab`). The native bridge lives in `src/native/pencilkit*`
with an iOS variant resolved through `requireOptionalNativeModule` and
explicit `.android.ts` / `.web.ts` stubs. The module surface lives in
`src/modules/pencilkit-lab/` with a `screen.tsx` for iOS and platform
banners for everything else.

## File map

```
src/native/
  pencilkit.types.ts       Types + NotSupported error + module name
  pencilkit.ts             iOS variant — requireOptionalNativeModule
  pencilkit.android.ts     Stub — rejects with PencilKitNotSupported
  pencilkit.web.ts         Stub — rejects with PencilKitNotSupported

src/modules/pencilkit-lab/
  index.tsx                ModuleManifest (id, title, icon, minIOS 17.0)
  screen.tsx               iOS screen (Platform.OS gate + ScrollView)
  screen.android.tsx       IOSOnlyBanner
  screen.web.tsx           IOSOnlyBanner
  hooks/usePencilKit.ts    State machine + __setPencilKitBridgeForTests
  components/
    IOSOnlyBanner.tsx      Non-iOS gate
    CapabilityCard.tsx     Surfaces CanvasInfo
    PolicyPicker.tsx       Chip selector — DrawingPolicy
    ToolPicker.tsx         Chip selector — ToolType
    DrawingCanvas.tsx      Placeholder for native PKCanvasView
    DrawingStats.tsx       Stroke / data / bounds readout
    SetupInstructions.tsx  Swift integration notes

src/modules/registry.ts    Append `pencilkitLab` after `swiftdataLab`
```

## Test strategy

Mirror feature 053's test layout:

- `test/unit/native/pencilkit-bridge.test.ts` — exercises the
  android / web stubs and `PencilKitNotSupported`.
- `test/unit/modules/pencilkit-lab/manifest.test.ts` — manifest invariants.
- `test/unit/modules/pencilkit-lab/screen.{android,web,ios}.test.tsx` —
  smoke tests; iOS variant mocks the hook.
- `test/unit/modules/pencilkit-lab/usePencilKit.test.tsx` — state machine.
- `test/unit/modules/pencilkit-lab/components/*.test.tsx` — one per
  component.

Tests never use `getByText` for strings that may appear more than once
(chip labels, repeated headings) — those use `getAllByText(...).length`.

## Open questions

- The Swift Expo Module is deferred; once it ships, `screen.tsx` can swap
  the placeholder for a native view component without touching the hook
  or types.
