# Feature 082 — PencilKit — Tasks

## T1 — Bridge types
- [x] Create `src/native/pencilkit.types.ts` with `NATIVE_MODULE_NAME`,
      `ToolType`, `DrawingPolicy`, `ToolInfo`, `DrawingStats`,
      `CanvasInfo`, `PencilKitBridge`, `PencilKitNotSupported`.

## T2 — Native bridge
- [x] `src/native/pencilkit.ts` — iOS via `requireOptionalNativeModule`.
- [x] `src/native/pencilkit.android.ts` — every method rejects.
- [x] `src/native/pencilkit.web.ts` — every method rejects.

## T3 — Module manifest + screens
- [x] `src/modules/pencilkit-lab/index.tsx` (lazy `render`).
- [x] `screen.tsx` (iOS) — composes capability / pickers / canvas / stats.
- [x] `screen.android.tsx` and `screen.web.tsx` — IOSOnlyBanner.

## T4 — Hook
- [x] `hooks/usePencilKit.ts` with `__setPencilKitBridgeForTests`.

## T5 — Components
- [x] `IOSOnlyBanner`, `CapabilityCard`, `PolicyPicker`, `ToolPicker`,
      `DrawingCanvas`, `DrawingStats`, `SetupInstructions`.

## T6 — Registry
- [x] Append `pencilkitLab` import + entry in `src/modules/registry.ts`.

## T7 — Unit tests
- [x] `test/unit/native/pencilkit-bridge.test.ts`.
- [x] `test/unit/modules/pencilkit-lab/manifest.test.ts`.
- [x] `test/unit/modules/pencilkit-lab/screen.{android,web,ios}.test.tsx`.
- [x] `test/unit/modules/pencilkit-lab/usePencilKit.test.tsx`.
- [x] `test/unit/modules/pencilkit-lab/components/*.test.tsx`.

## T8 — Quality gates
- [x] `pnpm format`
- [x] `pnpm check`
- [x] `pnpm test -- --testPathPattern="pencilkit"`
- [x] `pnpm test`

## Deferred
- Swift Expo Module hosting `PKCanvasView` + `PKToolPicker`.
