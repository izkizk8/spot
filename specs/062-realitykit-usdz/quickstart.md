# Quickstart: 062 — RealityKit USDZ AR Preview

## What This Showcases

- **AR Quick Look** — present a USDZ 3D model in iOS AR Quick Look with one tap.
- **RealityKit capabilities** — query device AR support flags at runtime.

## iOS Setup

No extra entitlements are required. AR Quick Look is built into iOS 13+ via
`QLPreviewController`. The USDZ file is sourced from the network or bundled assets.

## Running the Demo

1. Open the Spot app on an iPhone running iOS 13+.
2. Navigate to the **RealityKit USDZ** entry in the module list.
3. Tap **Open AR Quick Look** to view the model.

## Files of Interest

| Path | Purpose |
|------|---------|
| `src/native/realitykit-usdz.ts` | iOS bridge seam |
| `src/modules/062-realitykit-usdz/hooks/useRealityKitUsdz.ts` | State machine |
| `src/modules/062-realitykit-usdz/screen.tsx` | iOS screen |
