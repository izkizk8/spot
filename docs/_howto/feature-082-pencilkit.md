---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone or simulator running iOS 14+
  - Apple Developer account (free tier is sufficient)
---

# How to verify PencilKit drawing canvas on iPhone

## Goal

Open the PencilKit drawing canvas lab, draw on the canvas with Apple Pencil (or
finger), switch tools, and confirm `PKDrawing.dataRepresentation()` round-trips
correctly.

## Prerequisites

- macOS with Xcode 15+
- iPhone or simulator running iOS 14+ (PencilKit is available since iOS 13; canvas
  host requires iOS 14+ for full tool picker)
- Apple Pencil optional — finger drawing also works
- Free Apple Developer account (no entitlements required)
- `pnpm install` already run

## Steps

1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native iOS project (macOS only):
   ```bash
   npx expo prebuild --clean
   ```
3. Open `ios/Spot.xcworkspace` in Xcode, select your personal team under
   **Signing & Capabilities**, and connect your iPhone.
4. Build and run with **Product → Run** (⌘R).
5. In the app, open the **Modules** tab and tap **PencilKit**.
6. The drawing canvas renders with the `PKToolPicker` floating palette.
7. Draw freely with a finger or Apple Pencil.
8. Switch tools using the palette (pen, pencil, marker, eraser, lasso).
9. Tap **Save Drawing** — the bridge serialises the canvas via
   `PKDrawing.dataRepresentation()` and shows the byte count.
10. Tap **Clear** then **Load Drawing** to restore the saved strokes.

## Verify

- Canvas renders and accepts touch input without lag
- All tool types produce visually distinct strokes
- Save → Clear → Load round-trip restores the original drawing
- No entitlement or permission dialog appears (PencilKit needs neither)

## Troubleshooting

- **Canvas is blank / not accepting touch** → confirm iOS 14+ device or simulator;
  check Xcode console for `PKCanvasView` setup errors
- **Tool picker not visible** → on simulator, the picker may need to be toggled via
  the **Toggle Finger Drawing** button in the lab toolbar
- **"Drawing data corrupted" error on load** → the saved data uses
  `PKDrawing.dataRepresentation()` format; do not manually edit the saved bytes

> **Note:** The current implementation uses an educational placeholder canvas. The full
> `PKCanvasView` Expo Module Swift host is planned as a follow-up feature.

## Implementation references

- Spec: `specs/082-pencilkit/spec.md`
- Plan: `specs/082-pencilkit/plan.md`
- Module: `src/modules/pencilkit-lab/`
- Native bridge: `src/native/pencilkit.ts`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows