# Feature 082 — PencilKit — Quickstart

## Run the lab

```bash
pnpm install
pnpm ios   # iOS simulator (iOS 17+)
```

Open the Modules tab and pick **PencilKit**. On non-iOS platforms the
screen renders the `IOSOnlyBanner` gate.

## Test the lab

```bash
# Just the new tests
pnpm test -- --testPathPattern="pencilkit"

# Whole suite
pnpm test
```

## Files of interest

- Bridge: `src/native/pencilkit.ts` (iOS), `pencilkit.android.ts`,
  `pencilkit.web.ts`, `pencilkit.types.ts`.
- Module: `src/modules/pencilkit-lab/`.
- Registry: `src/modules/registry.ts` (look for `pencilkitLab`).

## Notes

- The drawing canvas surface is an **educational placeholder**. The
  actual `PKCanvasView` host lives in a Swift Expo Module that will be
  implemented in a follow-up feature.
- PencilKit does not require any Info.plist key, capability, or
  entitlement.
- `PKDrawing.dataRepresentation()` is the canonical persistence format.
