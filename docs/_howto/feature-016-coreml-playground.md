---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Core ML native build required)
  - iPhone running iOS 13+ (Neural Engine on A12+ for best performance)
  - Apple Developer account (free tier sufficient)
  - MobileNetV2.mlmodel downloaded from https://developer.apple.com/machine-learning/models/
---

# How to verify Core ML Playground on iPhone

## Goal
Confirm that the MobileNetV2 image-classification model runs on-device via
Core ML, returning top-5 predictions and performance metrics, and that the
bundled sample images and the photo library picker both work.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 13+ (A12+ chip for Neural Engine path)
- `with-coreml` plugin registered in `app.json`
- `MobileNetV2.mlmodel` (~17 MB) placed at `native/ios/coreml/models/MobileNetV2.mlmodel`
  (download from https://developer.apple.com/machine-learning/models/)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Place the model file (see Prerequisites), then prebuild and build:
   ```bash
   npx expo prebuild --clean   # plugin verifies model presence; fails fast if absent
   eas build --platform ios
   ```
3. Install the IPA on your iPhone per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"CoreML Lab"** in the Modules tab.
5. Confirm: Image Source Picker, Sample Image Grid, inference button (disabled),
   Predictions Chart, Performance Metrics, and Model Picker are visible.
6. Tap a bundled sample (e.g., labrador) → inference button enables.
7. Tap **Run Inference** — within ~100 ms (A14+) the Predictions Chart animates
   5 bars with class names and confidence percentages.
8. Verify Performance Metrics shows elapsed ms and compute units (CPU / ANE).
9. Tap **Pick from Photo Library** → grant permission → pick any photo → tap
   **Run Inference** — top-5 predictions render.

## Verify
- `expo prebuild` fails fast and clearly when the model file is missing
- Top-5 predictions render as sorted descending bars with labels and percentages
- Performance Metrics shows positive ms value and at least one compute unit
- Re-entry guard: rapid-tapping Run Inference fires only one inference at a time
- On Android/web: "CoreML is iOS-only" banner, Run Inference button disabled, no exceptions

## Troubleshooting
- **`expo prebuild` fails with `[with-coreml] ERROR: model file not found`** →
  download MobileNetV2.mlmodel from Apple and place at `native/ios/coreml/models/`
- **Inference button stays disabled after selecting a sample** → check Console.app
  for `[CoreMLBridge] loadModel` error; verify `.mlmodelc` is in the app bundle
- **Performance Metrics shows `CPU` only on modern device** → A11 or older has no
  Neural Engine; CPU result is correct and expected

## Implementation references
- Spec: `specs/016-coreml-playground/spec.md`
- Plan: `specs/016-coreml-playground/plan.md`
- Module: `src/modules/coreml-lab/`
- Native bridge: `src/native/coreml.ts`
- Plugin: `plugins/with-coreml/`
- Swift: `native/ios/coreml/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows